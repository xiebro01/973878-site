/**
 * GET /api/games — Steam 游戏库
 * ------------------------------------------------------------
 * 环境变量（Cloudflare Pages → 设置 → 环境变量）：
 *   STEAM_ID    必填。可以是 vanity 名（如 xiebro01）或 17 位 SteamID64
 *   STEAM_KEY   可选。填了就走官方 Web API（JSON，能拿到最近两周时长）
 *               不填则回退到公开资料页的 XML（只需资料公开，不需要 key）
 *
 * 前提：Steam 个人资料的「游戏详情」必须是公开的，否则拿不到任何数据。
 * 调试：访问 /api/games?debug=1 会返回原始抓取结果，便于排查。
 */

const STEAM_CDN = 'https://cdn.cloudflare.steamstatic.com/steam/apps';
const UA = 'Mozilla/5.0 (compatible; 973878-xyz/1.0)';

export async function onRequestGet({ request, env }) {
  const id = (env.STEAM_ID || '').trim();
  if (!id) {
    return json({ error: 'missing_env', message: '未配置 STEAM_ID 环境变量' }, 500);
  }

  const debug = new URL(request.url).searchParams.has('debug');

  try {
    const data = env.STEAM_KEY
      ? await viaWebApi(id, env.STEAM_KEY, debug)
      : await viaPublicXml(id, debug);

    return json(data, 200, { 'Cache-Control': 'public, max-age=1800, s-maxage=1800' });
  } catch (err) {
    return json({ error: 'fetch_failed', message: String(err && err.message || err) }, 502);
  }
}

/* ---------------- 官方 Web API（需要 key）---------------- */
async function viaWebApi(id, key, debug) {
  let steamid = id;

  // vanity → steamid64
  if (!/^\d{17}$/.test(id)) {
    const r = await fetch(
      `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${key}&vanityurl=${encodeURIComponent(id)}`
    );
    const j = await r.json();
    if (!j.response || j.response.success !== 1) {
      throw new Error(`找不到这个 Steam 自定义名称：${id}`);
    }
    steamid = j.response.steamid;
  }

  const url =
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${key}` +
    `&steamid=${steamid}&include_appinfo=1&include_played_free_games=1&format=json`;
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`Steam API 返回 ${r.status}（key 无效，或资料不公开）`);
  const j = await r.json();

  if (debug) return { mode: 'webapi', raw: j };

  const games = (j.response && j.response.games) || [];
  if (!games.length) throw new Error('库是空的，或者「游戏详情」没有设为公开');

  return normalize(
    games.map((g) => ({
      id: g.appid,
      name: g.name,
      minutes: g.playtime_forever || 0,
      recent: g.playtime_2weeks || 0,
    })),
    'webapi'
  );
}

/* ---------------- 公开资料 XML（不需要 key）---------------- */
async function viaPublicXml(id, debug) {
  const path = /^\d{17}$/.test(id) ? `profiles/${id}` : `id/${encodeURIComponent(id)}`;
  const url = `https://steamcommunity.com/${path}/games?tab=all&xml=1`;

  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`Steam 资料页返回 ${r.status}（检查 ID 是否正确、资料是否公开）`);

  const xml = await r.text();
  if (debug) return { mode: 'xml', url, sample: xml.slice(0, 1200) };

  if (/This profile is private/i.test(xml)) {
    throw new Error('Steam 资料是私密的，请在隐私设置里把「游戏详情」改为公开');
  }

  const blocks = xml.match(/<game>[\s\S]*?<\/game>/g) || [];
  if (!blocks.length) throw new Error('没有解析到游戏，可能资料未公开或格式有变');

  const games = blocks.map((b) => {
    const appid = pick(b, 'appID');
    const name = decode(pick(b, 'name'));
    const hours = parseFloat((pick(b, 'hoursOnRecord') || '0').replace(/,/g, '')) || 0;
    return { id: Number(appid), name, minutes: Math.round(hours * 60) };
  }).filter((g) => g.id && g.name);

  if (!games.length) throw new Error('游戏列表为空');

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
      recent: g.recent ? Math.round((g.recent / 60) * 10) / 10 : 0,
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
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      ...extra,
    },
  });
}
