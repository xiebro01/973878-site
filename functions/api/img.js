/**
 * GET /api/img?u=<图片地址>
 * ------------------------------------------------------------
 * 把第三方图片（NeoDB 等）从 Cloudflare 边缘代理回来，
 * 这样访客只需要能访问 973878.xyz，不必能访问源站。
 *
 * 只允许白名单域名，避免被当成任意代理使用。
 */

const ALLOW = new Set([
  'neodb.social',
  'cdn.cloudflare.steamstatic.com',
  'shared.akamai.steamstatic.com',
  'a.ltrbxd.com',
  'image.tmdb.org',
]);

const UA = 'Mozilla/5.0 (compatible; 973878-xyz/1.0)';
const TTL = 604800; // 7 天

export async function onRequestGet({ request }) {
  const raw = new URL(request.url).searchParams.get('u');
  if (!raw) return text('缺少参数 u', 400);

  let target;
  try {
    target = new URL(raw);
  } catch (_) {
    return text('图片地址不合法', 400);
  }

  if (!ALLOW.has(target.hostname)) return text('这个域名不在白名单里', 403);

  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const key = new Request(request.url, { method: 'GET' });

  if (cache) {
    const hit = await cache.match(key);
    if (hit) return hit;
  }

  let up;
  try {
    up = await fetch(target.toString(), {
      headers: { 'User-Agent': UA, Accept: 'image/*' },
      cf: { cacheTtl: 86400, cacheEverything: true },
    });
  } catch (e) {
    return text('取图失败：' + String((e && e.message) || e), 502);
  }

  if (!up.ok) return text('源站返回 ' + up.status, 502);

  const res = new Response(up.body, {
    headers: {
      'content-type': up.headers.get('content-type') || 'image/jpeg',
      'cache-control': 'public, max-age=' + TTL + ', immutable',
      'access-control-allow-origin': '*',
    },
  });

  if (cache) {
    try {
      await cache.put(key, res.clone());
    } catch (_) { /* 缓存失败不影响返回 */ }
  }

  return res;
}

function text(msg, status) {
  return new Response(msg, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
