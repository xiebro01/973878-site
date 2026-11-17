/**
 * 可选：带「可动态修改」能力的短链 Worker
 * ------------------------------------------------------------
 * 平时用 _redirects 就够了。只有当你想要下面这些能力时才需要它：
 *   - 不重新部署就能改目标地址（存 KV）
 *   - 加访问计数 / 简单统计
 *   - 按 UA、地区做分流
 *
 * 部署方式（Cloudflare Dashboard）：
 *   1. Workers & Pages → Create → Worker，把本文件粘进去
 *   2. Settings → Variables → 绑定 KV namespace，变量名填 LINKS
 *   3. Settings → Triggers → Add route：973878.xyz/go/*
 *   4. 在 KV 里加键值对，比如 key=github, value=https://github.com/yourname
 *
 * 注意：如果同时存在 _redirects 的 /go/* 规则，Worker 路由优先级更高，
 *      两者别写同一个路径，容易自己跟自己打架。
 */

const FALLBACK = {
  github: 'https://github.com/yourname',
  blog: '/blog/',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.replace(/^\/go\/?/, '').replace(/\/+$/, '');

    // 访问 /go 时列出现有短链，方便自己查
    if (!key) {
      let keys = Object.keys(FALLBACK);
      if (env.LINKS) {
        const list = await env.LINKS.list();
        keys = list.keys.map((k) => k.name);
      }
      return Response.json({ links: keys });
    }

    let target = null;
    if (env.LINKS) target = await env.LINKS.get(key);
    if (!target) target = FALLBACK[key] || null;

    if (!target) {
      return new Response('短链不存在', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }

    // 支持站内相对路径，也支持完整 URL
    const location = target.startsWith('http') ? target : new URL(target, url.origin).toString();
    return Response.redirect(location, 302);
  },
};
