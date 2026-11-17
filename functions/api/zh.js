/**
 * GET /api/zh?type=game|movie&q=<名字>
 * ------------------------------------------------------------
 * 用 Bangumi 的公开搜索接口补中文名，不需要账号、不需要 key。
 *   type=game  → Bangumi subject type 4（游戏）
 *   type=movie → Bangumi subject type 6（三次元：电影/剧集）
 *
 * 只在页面需要时按条查询，结果在边缘缓存 30 天。
 * 返回：{ "zh": "艾尔登法环" } 或 { "zh": null }
 */

const UA = '973878-xyz/1.0 (https://973878.xyz)';
const TTL = 2592000; // 30 天

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const type = url.searchParams.get('type') === 'movie' ? 6 : 4;

  if (!q) return json({ zh: null });

  const cache = caches.default;
  const key = new Request(`https://zh.973878.xyz/${type}/${encodeURIComponent(q)}`);

  const hit = await cache.match(key);
  if (hit) return hit;

  let zh = null;
  try {
    zh = await lookup(q, type);
  } catch (_) {
    zh = null;
  }

  const res = json({ zh }, 200, { 'Cache-Control': `public, max-age=${TTL}` });
  await cache.put(key, res.clone());
  return res;
}

async function lookup(q, type) {
  const api =
    `https://api.bgm.tv/search/subject/${encodeURIComponent(q)}` +
    `?type=${type}&responseGroup=small&max_results=8`;

  const r = await fetch(api, { headers: { 'User-Agent': UA } });
  if (!r.ok) return null;

  const j = await r.json();
  const list = Array.isArray(j.list) ? j.list : [];
  if (!list.length) return null;

  const target = norm(q);
  let best = null;
  let bestScore = 0;

  for (const item of list) {
    const names = [item.name, item.name_cn].filter(Boolean);
    let score = 0;
    for (const n of names) {
      const s = norm(n);
      if (!s) continue;
      if (s === target) score = Math.max(score, 100);
      else if (s.startsWith(target) || target.startsWith(s)) score = Math.max(score, 80);
      else if (s.includes(target) || target.includes(s)) score = Math.max(score, 60);
    }
    if (score > bestScore && item.name_cn) {
      bestScore = score;
      best = item.name_cn;
    }
  }

  return bestScore >= 60 ? best : null;
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '');
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
