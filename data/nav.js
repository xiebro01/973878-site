/* ============================================================
   导航站数据 — 改这里就够，页面会自动渲染
   ------------------------------------------------------------
   name  显示名称（首字用作图标兜底）
   url   链接
   desc  一句话说明，越短越好
   slow  true 表示国内通常要代理，右侧会显示一个小圆点
   ============================================================ */
window.NAV = {
  updated: '2026-11',

  groups: [
    {
      title: '常用',
      items: [
        { name: '邮箱',       url: 'https://mail.google.com',      desc: 'xie@973878.xyz 转发到这' },
        { name: 'Cloudflare', url: 'https://dash.cloudflare.com',  desc: 'DNS · Pages · 邮件路由' },
        { name: 'GitHub',     url: 'https://github.com/xiebro01',  desc: '我的仓库' },
        { name: 'Spaceship',  url: 'https://www.spaceship.com',    desc: '域名续费与转移' }
      ]
    },
    {
      title: '记录',
      items: [
        { name: 'Steam',      url: 'https://store.steampowered.com', desc: '游戏库 · 时长' },
        { name: 'SteamDB',    url: 'https://steamdb.info',           desc: '史低与促销' },
        { name: 'Bangumi',    url: 'https://bgm.tv',                 desc: '动画 · 游戏 · 收藏' },
        { name: 'Letterboxd', url: 'https://letterboxd.com/xie73/',  desc: '观影记录', slow: true },
        { name: 'NeoDB',      url: 'https://neodb.social',           desc: '书影音游 标记' },
        { name: '豆瓣电影',    url: 'https://movie.douban.com',       desc: '评分参考' }
      ]
    },
    {
      title: '工具站',
      items: [
        { name: 'MDN',        url: 'https://developer.mozilla.org', desc: 'Web 标准文档' },
        { name: 'Can I use',  url: 'https://caniuse.com',           desc: '兼容性查询' },
        { name: 'DevDocs',    url: 'https://devdocs.io',            desc: '离线文档聚合' },
        { name: 'regex101',   url: 'https://regex101.com',          desc: '正则调试' },
        { name: 'it-tools',   url: 'https://it-tools.tech',         desc: '一堆小工具合集' },
        { name: 'Excalidraw', url: 'https://excalidraw.com',        desc: '随手画图' },
        { name: 'TinyPNG',    url: 'https://tinypng.com',           desc: '图片压缩' },
        { name: '草料二维码',  url: 'https://cli.im',                desc: '二维码生成' }
      ]
    },
    {
      title: 'AI',
      items: [
        { name: 'DeepSeek',     url: 'https://chat.deepseek.com',  desc: '日常主力' },
        { name: 'Claude',       url: 'https://claude.ai',          desc: '长文与代码', slow: true },
        { name: 'ChatGPT',      url: 'https://chatgpt.com',        desc: '通用问答', slow: true },
        { name: 'Kimi',         url: 'https://kimi.moonshot.cn',   desc: '长文档阅读' },
        { name: '通义千问',      url: 'https://tongyi.aliyun.com',  desc: '国内速度稳' },
        { name: 'Hugging Face', url: 'https://huggingface.co',     desc: '模型与数据集', slow: true }
      ]
    }
  ]
};
