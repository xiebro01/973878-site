/**
 * GET /api/games — Steam 游戏库
 * ------------------------------------------------------------
 * 环境变量：
 *   STEAM_ID    必填。vanity 名（如 xie73）或 17 位 SteamID64
 *   STEAM_KEY   可选。填了走官方 Web API（能拿到最近两周时长）
 *
 * 排错入口：
 *   /api/games?probe=1   逐条测试 Steam 各个域名是否可达（返回状态码与耗时）
 *   /api/games?debug=1   返回抓到的原始内容
 */

const STEAM_CDN = 'https://cdn.cloudflare.steamstatic.com/steam/apps';
const UA = 'Mozilla/5.0 (compatible; 973878-xyz/1.0)';
const TIMEOUT = 9000;

export async function onRequestGet(context) {
  try {
    return await handle(context);
  } catch (err) {
    return json({
      error: 'unhandled',
      message: String((err && err.message) || err),
      stack: String((err && err.stack) || '').split('\n').slice(0, 6),
    }, 500);
  }
}

async function handle({ request, env }) {
  const url = new URL(request.url);

  if (url.searchParams.has('probe')) return json(await probe(env));

  const id = String((env && env.STEAM_ID) || '').trim();
  if (!id) {
    return json({ error: 'missing_env', message: '未配置 STEAM_ID 环境变量' }, 500);
  }

  const debug = url.searchParams.has('debug');
  const key = String((env && env.STEAM_KEY) || '').trim();

  const data = key ? await viaWebApi(id, key) : await viaPublicXml(id);
  if (debug) return json(data);

  return json(data, 200, { 'Cache-Control': 'public, max-age=1800, s-maxage=1800' });
}

/* ---------------- 探活 ---------------- */
async function probe(env) {
  const id = String((env && env.STEAM_ID) || 'xie73').trim();
  const targets = [
    `https://steamcommunity.com/id/${encodeURIComponent(id)}/games?tab=all&xml=1`,
    `https://steamcommunity.com/profiles/${id}/games?tab=all&xml=1`,
    'https://store.steampowered.com/api/appdetails?appids=1245620&l=schinese',
    'https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?vanityurl=' + encodeURIComponent(id),
  ];

  const out = [];
  for (const t of targets) {
    const started = Date.now();
    try {
      const r = await fetchT(t, { headers: { 'User-Agent': UA } }, 6000);
      const text = await r.text();
      out.push({
        url: t,
        status: r.status,
        ms: Date.now() - started,
        bytes: text.length,
        head: text.slice(0, 160).replace(/\s+/g, ' '),
      });
    } catch (e) {
      out.push({ url: t, error: String((e && e.message) || e), ms: Date.now() - started });
    }
  }
  return { steam_id: id, has_key: Boolean(env && env.STEAM_KEY), probes: out };
}

/* ---------------- 官方 Web API ---------------- */
async function viaWebApi(id, key) {
  let steamid = id;

  if (!/^\d{17}$/.test(id)) {
    const r = await fetchT(
      `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${key}&vanityurl=${encodeURIComponent(id)}`,
      { headers: { 'User-Agent': UA } }
    );
    const j = await r.json().catch(() => ({}));
    if (!j.response || j.response.success !== 1) {
      throw new Error(`Steam ID 解析失败（${id}），确认自定义 URL 是否正确`);
    }
    steamid = j.response.steamid;
  }

  const r = await fetchT(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${key}` +
    `&steamid=${steamid}&include_appinfo=1&include_played_free_games=1&format=json`,
    { headers: { 'User-Agent': UA } }
  );
  if (!r.ok) throw new Error(`Steam Web API 返回 ${r.status}（key 无效或资料不公开）`);

  const j = await r.json();
  const games = (j.response && j.response.games) || [];
  if (!games.length) throw new Error('库是空的，或「游戏详情」未设为公开');

  return normalize(
    games.map((g) => ({ id: g.appid, name: g.name, minutes: g.playtime_forever || 0 })),
    'webapi'
  );
}

/* ---------------- 公开资料 XML ---------------- */
async function viaPublicXml(id) {
  const path = /^\d{17}$/.test(id) ? `profiles/${id}` : `id/${encodeURIComponent(id)}`;
  const target = `https://steamcommunity.com/${path}/games?tab=all&xml=1`;

  const r = await fetchT(target, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`Steam 资料页返回 ${r.status}（检查 ID 与资料公开状态）`);

  const xml = await r.text();
  const usable = xml.replace(/\r/g, '');

  if (/This profile is private/i.test(usable)) {
    throw new Error('Steam 资料是私密的：请在隐私设置里把「游戏详情」改为公开');
  }

  const blocks = usable.match(/<game>[\s\S]*?<\/game>/g) || [];
  if (!blocks.length) {
    return {
      error: 'no_parse',
      message: '页面拿到了，但没解析出 <game> 节点',
      hint: '把下面 sample 发给我，看实际格式',
      sample: usable.slice(0, 600),
    };
  }

  const games = blocks.map((b) => {
    const appid = pick(b, 'appID');
    const name = decode(pick(b, 'name'));
    const hours = parseFloat((pick(b, 'hoursOnRecord') || '0').replace(/,/g, '')) || 0;
    return { id: Number(appid), name, minutes: Math.round(hours * 60) };
  }).filter((g) => g.id && g.name);

  return normalize(games, 'xml');
}

/* ---------------- 统一输出 ---------------- */
function normalize(games, mode) {
  const items = games
    .slice()
    .sort((a, b) => b.minutes - a.minutes)
    .map((g) => ({
      id: g.id,
      name: g.name,
      hours: Math.round((g.minutes / 60) * 10) / 10,
      cover: `${STEAM_CDN}/${g.id}/library_600x900.jpg`,
      url: `https://store.steampowered.com/app/${g.id}`,
    }));

  const totalMinutes = games.reduce((s, g) => s + g.minutes, 0);

  return {
    source: 'steam',
    mode,
    updated: new Date().toISOString().slice(0, 10),
    total: items.length,
    hours: Math.round(totalMinutes / 60),
    items,
  };
}

/* ---------------- 小工具 ---------------- */
async function fetchT(url, opts = {}, ms = TIMEOUT) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function pick(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!m) return '';
  return m[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
}

function decode(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function json(obj, status = 200, extra = {}) {
  let body;
  try {
    body = JSON.stringify(obj);
  } catch (e) {
    body = JSON.stringify({ error: 'serialize_failed', message: String(e) });
  }
  return new Response(body, {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      ...extra,
    },
  });
}
