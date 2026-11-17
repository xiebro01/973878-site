/**
 * GET /api/games — Steam 游戏库
 * ------------------------------------------------------------
 * 环境变量：
 *   STEAM_ID    必填。vanity 名（如 xie73）或 17 位 SteamID64
 *   STEAM_KEY   可选。有 key 时走官方 Web API（最稳）；没有则解析公开资料页
 *
 * 说明：Steam 已停掉 games?xml=1 的 XML 输出（现在返回 HTML），
 *      所以无 key 时改为解析资料页 HTML。
 *
 * 排错入口：
 *   /api/games?probe=1   测试各域名是否可达
 *   /api/games?deep=1    返回 HTML 结构诊断（用于调整解析规则）
 */

const STEAM_CDN = 'https://cdn.cloudflare.steamstatic.com/steam/apps';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const TIMEOUT = 9000;

export async function onRequestGet(context) {
  try {
    return await handle(context);
  } catch (err) {
    return json({
      error: 'unhandled',
      message: String((err && err.message) || err),
      stack: String((err && err.stack) || '').split('\n').slice(0, 5),
    }, 500);
  }
}

async function handle({ request, env }) {
  const url = new URL(request.url);

  if (url.searchParams.has('probe')) return json(await probe(env));
  if (url.searchParams.has('deep')) return json(await deep(env));

  const id = String((env && env.STEAM_ID) || '').trim();
  if (!id) {
    return json({ error: 'missing_env', message: '未配置 STEAM_ID 环境变量（Cloudflare Pages → 设置 → 变量和密钥）' }, 500);
  }

  const key = String((env && env.STEAM_KEY) || '').trim();
  const data = key ? await viaWebApi(id, key) : await viaPublicPage(id);

  const debug = url.searchParams.has('debug');
  return debug ? json(data) : json(data, 200, { 'Cache-Control': 'public, max-age=1800, s-maxage=1800' });
}

/* ---------------- 探活 ---------------- */
async function probe(env) {
  const id = String((env && env.STEAM_ID) || 'xie73').trim();
  const targets = [
    gamesUrl(id),
    'https://store.steampowered.com/api/appdetails?appids=1245620&l=schinese',
    'https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?vanityurl=' + encodeURIComponent(id),
  ];

  const out = [];
  for (const t of targets) {
    const started = Date.now();
    try {
      const r = await fetchT(t, { headers: { 'User-Agent': UA } }, 8000);
      const text = await r.text();
      out.push({ url: t, status: r.status, ms: Date.now() - started, bytes: text.length, ct: r.headers.get('content-type') });
    } catch (e) {
      out.push({ url: t, error: String((e && e.message) || e), ms: Date.now() - started });
    }
  }
  return { steam_id: id, has_id: Boolean(env && env.STEAM_ID), has_key: Boolean(env && env.STEAM_KEY), probes: out };
}

/* ---------------- HTML 结构诊断 ---------------- */
async function deep(env) {
  const id = String((env && env.STEAM_ID) || 'xie73').trim();
  const target = gamesUrl(id);
  const r = await fetchT(target, { headers: { 'User-Agent': UA } }, 8000);
  const html = await r.text();

  const count = (re) => (html.match(re) || []).length;
  const slice = (needle, before = 200, size = 900) => {
    const i = html.indexOf(needle);
    return i < 0 ? null : html.slice(Math.max(0, i - before), i + size);
  };

  const classes = {};
  (html.match(/class="([^"]{1,80})"/g) || []).forEach((c) => {
    const v = c.slice(7, -1).trim();
    if (v) classes[v] = (classes[v] || 0) + 1;
  });
  const topClasses = Object.entries(classes).sort((a, b) => b[1] - a[1]).slice(0, 25);

  const scripts = (html.match(/<script[^>]+src="([^"]+)"/g) || [])
    .map((s) => (s.match(/src="([^"]+)"/) || [])[1]).slice(0, 12);

  return {
    target,
    status: r.status,
    bytes: html.length,
    title: (html.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || null,
    markers: {
      profilePrivate: /This profile is private/i.test(html),
      couldNotBeFound: /could not be found/i.test(html),
      signIn: /Sign In/i.test(html),
      ageGate: /agecheck|Mature Content/i.test(html),
    },
    counts: {
      app_href: count(/href="[^"]*\/app\/\d+/g),
      app_full: count(/store\.steampowered\.com\/app\/\d+/g),
      data_appid: count(/data-appid/g),
      hours_words: count(/hoursOnRecord|hrs on record/gi),
      gameListRow: count(/gameListRow/g),
    },
    firstAppSnippet: slice('/app/'),
    bodyText: (html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ').trim()).slice(0, 700),
    topClasses,
    scripts,
  };
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
      throw new Error(`Steam ID 解析失败（${id}）`);
    }
    steamid = j.response.steamid;
  }

  const r = await fetchT(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${key}` +
    `&steamid=${steamid}&include_appinfo=1&include_played_free_games=1&format=json`,
    { headers: { 'User-Agent': UA } }
  );
  if (!r.ok) throw new Error(`Steam Web API 返回 ${r.status}`);

  const j = await r.json();
  const games = (j.response && j.response.games) || [];
  if (!games.length) throw new Error('库是空的，或「游戏详情」未设为公开');

  return normalize(games.map((g) => ({ id: g.appid, name: g.name, minutes: g.playtime_forever || 0 })), 'webapi');
}

/* ---------------- 公开资料页（HTML）---------------- */
async function viaPublicPage(id) {
  const r = await fetchT(gamesUrl(id), { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`Steam 资料页返回 ${r.status}`);

  const html = await r.text();

  if (/This profile is private/i.test(html)) {
    throw new Error('Steam 资料是私密的：请在隐私设置里把「游戏详情」改为公开');
  }

  if (/could not be found/i.test(html)) {
    throw new Error(`找不到 Steam 资料「${id}」：自定义 URL 可能不是这个，改用 17 位 SteamID64 更稳`);
  }

  const games = parseGames(html);
  if (!games.length) {
    return {
      error: 'no_parse',
      message: '页面拿到了，但没解析出游戏列表',
      hint: '访问 /api/games?deep=1 看结构诊断，把结果发给我',
    };
  }

  return normalize(games, 'page');
}

function gamesUrl(id) {
  const base = /^\d{17}$/.test(id) ? `profiles/${id}` : `id/${encodeURIComponent(id)}`;
  return `https://steamcommunity.com/${base}/games?tab=all&sort=playtime`;
}

/* 兼容几种已知结构：优先 JSON blob，其次行级 DOM */
function parseGames(html) {
  const out = [];

  // 1) 新版页面内嵌的 JSON：g_rgAppInfo = {"620":{...}, ...}
  const blob = html.match(/g_rgAppInfo\s*=\s*(\{[\s\S]*?\});/);
  if (blob) {
    try {
      const obj = JSON.parse(blob[1]);
      Object.keys(obj).forEach((appid) => {
        const g = obj[appid] || {};
        const name = g.name || '';
        const mins = Math.round((Number(g.hours) || 0) * 60);
        if (name) out.push({ id: Number(appid), name, minutes: mins });
      });
    } catch (_) { /* 落到下面的 DOM 解析 */ }
  }
  if (out.length) return out;

  // 2) 行级 DOM：<div class="gameListRow" id="game_620"> … 名称 … 时长
  const re = /<div[^>]*class="[^"]*gameListRow[^"]*"[^>]*>/g;
  const marks = [];
  let m;
  while ((m = re.exec(html))) {
    // 排除 gameListRowItem / gameListRowBorder 这类内层元素
    if (/gameListRow(Item|Border)/.test(m[0])) continue;
    marks.push(m.index);
  }

  for (let i = 0; i < marks.length; i++) {
    const start = marks[i];
    const end = i + 1 < marks.length ? marks[i + 1] : Math.min(html.length, start + 6000);
    const chunk = html.slice(start, end);

    const appid = (chunk.match(/id="game_(\d+)"/) ||
      chunk.match(/store\.steampowered\.com\/app\/(\d+)/) || [])[1];
    if (!appid) continue;

    const name = (chunk.match(/gameListRowItemName[^>]*>([^<]+)</) ||
      chunk.match(/<a[^>]+href="[^"]*app\/\d+"[^>]*>([^<]{2,90})</) || [])[1];
    if (!name) continue;

    const hours = (chunk.match(/([\d.,]+)\s*(?:hrs|小时)/i) || [])[1];
    out.push({
      id: Number(appid),
      name: decode(name.trim()),
      minutes: Math.round((parseFloat(String(hours || '0').replace(/,/g, '')) || 0) * 60),
    });
  }

  return out;
}

/* ---------------- 统一输出 ---------------- */
function normalize(games, mode) {
  const seen = new Set();
  const clean = games.filter((g) => g.id && g.name).filter((g) => {
    if (seen.has(g.id)) return false;
    seen.add(g.id);
    return true;
  }).sort((a, b) => b.minutes - a.minutes);

  const totalMinutes = clean.reduce((s, g) => s + (g.minutes || 0), 0);

  const items = clean.map((g) => ({
    id: g.id,
    name: g.name,
    hours: Math.round(((g.minutes || 0) / 60) * 10) / 10,
    cover: `${STEAM_CDN}/${g.id}/library_600x900.jpg`,
    url: `https://store.steampowered.com/app/${g.id}`,
  }));

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

function decode(s) {
  return String(s)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function json(obj, status = 200, extra = {}) {
  let body;
  try {
    body = JSON.stringify(obj);
  } catch (e) {
    body = JSON.stringify({ error: 'serialize_failed' });
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
