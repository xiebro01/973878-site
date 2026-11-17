/**
 * GET /api/movies — Letterboxd 观影记录
 * ------------------------------------------------------------
 * 环境变量（Cloudflare Pages → 设置 → 环境变量）：
 *   LETTERBOXD_USER   必填。Letterboxd 用户名（个人主页 URL 里那段）
 *
 * 数据来源：https://letterboxd.com/{用户}/rss/
 * Letterboxd 的 RSS 不带 CORS 头，浏览器不能直连，必须由这里代理。
 * 字段：filmTitle / filmYear / memberRating / watchedDate / link
 */

const UA = 'Mozilla/5.0 (compatible; 973878-xyz/1.0)';

export async function onRequestGet({ request, env }) {
  const user = (env.LETTERBOXD_USER || '').trim();
  if (!user) {
    return json({ error: 'missing_env', message: '未配置 LETTERBOXD_USER 环境变量' }, 500);
  }

  const debug = new URL(request.url).searchParams.has('debug');
  const url = `https://letterboxd.com/${encodeURIComponent(user)}/rss/`;

  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.status === 404) throw new Error(`找不到 Letterboxd 用户：${user}`);
    if (!r.ok) throw new Error(`Letterboxd 返回 ${r.status}`);

    const xml = await r.text();
    if (debug) return json({ mode: 'rss', url, sample: xml.slice(0, 1500) });

    const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    if (!blocks.length) throw new Error('RSS 里没有条目（可能是新账号，还没标记过电影）');

    const items = blocks.map((b) => {
      const title = decode(pick(b, 'letterboxd:filmTitle'));
      const year = pick(b, 'letterboxd:filmYear');
      const rating = parseFloat(pick(b, 'letterboxd:memberRating'));
      const watched = pick(b, 'letterboxd:watchedDate');
      const link = pick(b, 'link');
      const desc = decode(stripTags(pick(b, 'description'))).replace(/\s+/g, ' ').trim();

      return {
        title,
        year: year ? Number(year) : null,
        rating: Number.isFinite(rating) ? rating : null,
        watched: watched || null,
        url: link || null,
        review: desc.slice(0, 240) || null,
      };
    }).filter((x) => x.title);

    items.sort((a, b) => String(b.watched || '').localeCompare(String(a.watched || '')));

    const rated = items.filter((x) => x.rating != null);
    const avg = rated.length
      ? Math.round((rated.reduce((s, x) => s + x.rating, 0) / rated.length) * 10) / 10
      : null;

    return json({
      source: 'letterboxd',
      updated: new Date().toISOString().slice(0, 10),
      total: items.length,
      average: avg,
      items,
    }, 200, { 'Cache-Control': 'public, max-age=1800, s-maxage=1800' });
  } catch (err) {
    return json({ error: 'fetch_failed', message: String(err && err.message || err) }, 502);
  }
}

function pick(xml, tag) {
  const esc = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = xml.match(new RegExp(`<${esc}>([\\s\\S]*?)</${esc}>`));
  if (!m) return '';
  return m[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, ' ');
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
