/**
 * GET /api/movies — 观影记录（Letterboxd + NeoDB 双源，取均分）
 * ------------------------------------------------------------
 * 环境变量：
 *   LETTERBOXD_USER   必填。Letterboxd 用户名
 *   NEO_DB_TOKEN      可选。NeoDB access token（read 权限即可）
 *
 * 分数统一到 10 分制：
 *   Letterboxd 0–5（含 0.5） → ×2
 *   NeoDB rating_grade 1–10  → 原样
 *   两边都有 → 取平均；只有一边 → 用单边分数
 *
 * 匹配方式：片名归一化后比对（去重音、去标点、去 the/a/an 之类前缀）。
 * 调试：/api/movies?debug=1
 */

const UA = 'Mozilla/5.0 (compatible; 973878-xyz/1.0)';

export async function onRequestGet({ request, env }) {
  const lbUser = (env.LETTERBOXD_USER || '').trim();
  const ndToken = (env.NEO_DB_TOKEN || '').trim();
  const debug = new URL(request.url).searchParams.has('debug');

  if (!lbUser && !ndToken) {
    return json({ error: 'missing_env', message: '至少配置 LETTERBOXD_USER 或 NEO_DB_TOKEN 中的一个' }, 500);
  }

  const tasks = [];
  if (lbUser) tasks.push(letterboxd(lbUser, debug));
  if (ndToken) tasks.push(neodb(ndToken, debug));

  const settled = await Promise.allSettled(tasks);
  const errors = [];
  const lb = [];
  const nd = [];

  settled.forEach((r, i) => {
    const which = (lbUser && i === 0) ? 'letterboxd' : 'neodb';
    if (r.status === 'fulfilled') {
      if (which === 'letterboxd') lb.push(...r.value);
      else nd.push(...r.value);
    } else {
      errors.push({ source: which, message: String(r.reason && r.reason.message || r.reason) });
    }
  });

  if (debug) return json({ letterboxd: lb, neodb: nd, errors });

  if (!lb.length && !nd.length) {
    return json({ error: 'empty', message: '两个来源都没有数据', errors }, 502);
  }

  return json(merge(lb, nd, errors), 200, { 'Cache-Control': 'public, max-age=1800, s-maxage=1800' });
}

/* ---------------- Letterboxd ---------------- */
/* 优先解析「看过的电影」页面：比 RSS 全（RSS 只有最近活动，且常常是空的） */
async function letterboxd(user, debug) {
  const pageUrl = `https://letterboxd.com/${encodeURIComponent(user)}/films/`;

  try {
    const r = await fetch(pageUrl, { headers: { 'User-Agent': UA } });
    if (r.status === 404) throw new Error(`找不到 Letterboxd 用户：${user}`);
    if (r.ok) {
      const html = await r.text();
      const list = parseFilmsPage(html);
      if (list.length) return list;
    }
  } catch (e) {
    if (String(e.message).includes('找不到')) throw e;
  }

  return viaRss(user);
}

/* 从 HTML 里解析海报墙条目 */
function parseFilmsPage(html) {
  const out = [];
  const seen = new Set();
  const re = /data-target-link="\/film\/([^"\/]+)\/"/g;
  let m;

  while ((m = re.exec(html))) {
    const slug = m[1];
    if (seen.has(slug)) continue;
    seen.add(slug);

    const chunk = html.slice(m.index, Math.min(html.length, m.index + 3000));
    const title = (chunk.match(/alt="([^"]+)"/) || [])[1] || slug;
    const rated = (chunk.match(/rated-(\d+)/) || [])[1];
    const year = (slug.match(/-(\d{4})$/) || [])[1];

    out.push({
      title: decode(title).replace(/\s*\(\d{4}\)$/, ''),
      year: year ? Number(year) : null,
      rating5: rated ? Number(rated) / 2 : null,
      watched: null,
      url: `https://letterboxd.com/film/${slug}/`,
      review: null,
    });
  }

  return out;
}

/* 备用：RSS（只含最近活动） */
async function viaRss(user) {
  const r = await fetch(`https://letterboxd.com/${encodeURIComponent(user)}/rss/`, {
    headers: { 'User-Agent': UA },
  });
  if (r.status === 404) throw new Error(`找不到 Letterboxd 用户：${user}`);
  if (!r.ok) throw new Error(`Letterboxd 返回 ${r.status}`);

  const xml = await r.text();
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

  return blocks.map((b) => {
    const rating = parseFloat(pick(b, 'letterboxd:memberRating'));
    return {
      title: decode(pick(b, 'letterboxd:filmTitle')),
      year: Number(pick(b, 'letterboxd:filmYear')) || null,
      rating5: Number.isFinite(rating) ? rating : null,
      watched: pick(b, 'letterboxd:watchedDate') || null,
      url: pick(b, 'link') || null,
      review: decode(stripTags(pick(b, 'description'))).replace(/\s+/g, ' ').trim().slice(0, 240) || null,
    };
  }).filter((x) => x.title);
}

/* ---------------- NeoDB ---------------- */
async function neodb(token, debug) {
  const out = [];
  for (const shelf of ['complete', 'progress']) {
    const url = `https://neodb.social/api/me/shelf/${shelf}?category=movie`;
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'User-Agent': UA },
    });
    if (!r.ok) throw new Error(`NeoDB ${shelf} 返回 ${r.status}（token 可能失效）`);
    const j = await r.json();

    (j.data || []).forEach((m) => {
      const item = m.item || {};
      // NeoDB 的 localized_title 是 [{lang, text}] 数组，不是字符串
      const zh = zhOf(item.localized_title) || '';
      const title = textOf(item.display_title) || textOf(item.title) || zh;
      if (!title) return;
      out.push({
        title,
        titleZh: zh && zh !== title ? zh : null,
        rating10: typeof m.rating_grade === 'number' ? m.rating_grade : null,
        comment: m.comment_text || null,
        shelf,
        date: String(m.created_time || '').slice(0, 10) || null,
        url: item.url ? new URL(item.url, 'https://neodb.social').toString() : null,
        cover: item.cover_image_url || null,
      });
    });
  }
  return out;
}

/* ---------------- 合并 + 均分 ---------------- */
function merge(lb, nd, errors) {
  const key = (t) => String(t || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(the|a|an|le|la|les|el|los|il|der|die|das)\s+/, '')
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ')
    .trim();

  const ndMap = new Map();
  nd.forEach((x) => {
    const k = key(x.title);
    if (!ndMap.has(k)) ndMap.set(k, x);
  });

  const used = new Set();
  const items = lb.map((x) => {
    const k = key(x.title);
    const match = ndMap.get(k);
    if (match) used.add(k);

    const a = x.rating5 != null ? x.rating5 * 2 : null;
    const b = match && match.rating10 != null ? match.rating10 : null;
    const score = a != null && b != null ? round1((a + b) / 2) : (a != null ? a : b);

    return {
      title: x.title,
      titleZh: (match && match.titleZh) || null,
      titleEn: match && match.titleZh ? match.title : null,
      year: x.year,
      sources: match ? ['letterboxd', 'neodb'] : ['letterboxd'],
      lb: x.rating5,
      nd: match ? match.rating10 : null,
      score,
      watched: x.watched,
      url: x.url,
      review: x.review,
      cover: (match && match.cover) || null,
    };
  });

  // NeoDB 里有、Letterboxd 里没有的，也补进来
  nd.forEach((x) => {
    const k = key(x.title);
    if (used.has(k)) return;
    items.push({
      title: x.title,
      titleZh: x.titleZh || null,
      titleEn: x.titleZh ? x.title : null,
      year: null,
      sources: ['neodb'],
      lb: null,
      nd: x.rating10,
      score: x.rating10,
      watched: x.date,
      url: x.url,
      review: x.comment ? String(x.comment).slice(0, 240) : null,
      cover: x.cover,
    });
  });

  // 保持 Letterboxd 页面本身的顺序（最近看过的在前），NeoDB 独有的追加在后
  const scored = items.filter((x) => x.score != null);
  const average = scored.length
    ? round1(scored.reduce((s, x) => s + x.score, 0) / scored.length)
    : null;

  const both = items.filter((x) => x.sources.length === 2).length;

  return {
    source: 'letterboxd+neodb',
    updated: new Date().toISOString().slice(0, 10),
    total: items.length,
    matched: both,
    average,
    sources: {
      letterboxd: { count: lb.length, ok: !errors.some((e) => e.source === 'letterboxd') },
      neodb: { count: nd.length, ok: !errors.some((e) => e.source === 'neodb') },
    },
    errors,
    items,
  };
}

/* ---------------- 小工具 ---------------- */
function round1(n) { return Math.round(n * 10) / 10; }

/* NeoDB 的多语言字段可能是字符串，也可能是 [{lang, text}] */
function textOf(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    const zh = v.find((x) => x && /^zh/i.test(x.lang || ''));
    const first = v[0];
    return (zh && zh.text) || (first && first.text) || '';
  }
  if (typeof v === 'object' && v.text) return v.text;
  return '';
}

function zhOf(v) {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    const zh = v.find((x) => x && /^zh/i.test(x.lang || ''));
    return zh ? zh.text : null;
  }
  return null;
}

function pick(xml, tag) {
  const esc = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = xml.match(new RegExp(`<${esc}>([\\s\\S]*?)</${esc}>`));
  if (!m) return '';
  return m[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
}

function stripTags(s) { return s.replace(/<[^>]+>/g, ' '); }

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
