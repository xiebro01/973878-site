/* ============================================================
   导航站数据 — 改这里就够，页面会自动渲染
   加一条：复制一行 { name, url, desc }
   desc 一句话说明，越短越好；badge 会自动取名字首字
   ============================================================ */
window.NAV = {
  updated: '2026-11',

  groups: [
    {
      title: '常用',
      items: [
        { name: '邮箱',       url: 'https://mail.google.com',   desc: 'xie@973878.xyz · 转发到常用邮箱' },
        { name: 'Cloudflare', url: 'https://dash.cloudflare.com', desc: 'DNS · Pages · 邮件路由' },
        { name: 'GitHub',     url: 'https://github.com/xiebro01', desc: '我的仓库' },
        { name: 'Spaceship',  url: 'https://www.spaceship.com', desc: '域名续费与转移' },
        { name: 'GitHub Desktop', url: 'https://desktop.github.com', desc: '提交与推送' }
      ]
    },
    {
      title: '开发',
      items: [
        { name: 'MDN',          url: 'https://developer.mozilla.org', desc: 'Web 标准文档' },
        { name: 'Can I use',    url: 'https://caniuse.com',           desc: '兼容性查询' },
        { name: 'DevDocs',      url: 'https://devdocs.io',            desc: '离线文档聚合' },
        { name: 'regex101',     url: 'https://regex101.com',          desc: '正则调试' },
        { name: 'JSON 格式化',   url: 'https://www.json.cn',           desc: '格式化与校验' },
        { name: 'Stack Overflow', url: 'https://stackoverflow.com',   desc: '报错的第一站' }
      ]
    },
    {
      title: 'AI',
      items: [
        { name: 'DeepSeek', url: 'https://chat.deepseek.com', desc: '日常主力' },
        { name: 'Claude',   url: 'https://claude.ai',         desc: '长文与代码' },
        { name: 'ChatGPT',  url: 'https://chatgpt.com',       desc: '通用问答' },
        { name: 'Kimi',     url: 'https://kimi.moonshot.cn',  desc: '长文档阅读' }
      ]
    },
    {
      title: '影音',
      items: [
        { name: 'Bangumi',    url: 'https://bgm.tv',          desc: '动画 · 游戏 · 记录' },
        { name: 'Letterboxd', url: 'https://letterboxd.com',  desc: '观影记录' },
        { name: 'NeoDB',      url: 'https://neodb.social',    desc: '书影音游 标记' },
        { name: '豆瓣电影',    url: 'https://movie.douban.com', desc: '评分参考' },
        { name: 'Bilibili',   url: 'https://www.bilibili.com', desc: '长视频' },
        { name: 'YouTube',    url: 'https://www.youtube.com',  desc: '海外视频' }
      ]
    },
    {
      title: '游戏',
      items: [
        { name: 'Steam',        url: 'https://store.steampowered.com', desc: '买游戏' },
        { name: 'SteamDB',      url: 'https://steamdb.info',           desc: '史低与促销' },
        { name: 'Backloggd',    url: 'https://backloggd.com',          desc: '游戏库记录' },
        { name: 'HowLongToBeat', url: 'https://howlongtobeat.com',     desc: '通关要多久' },
        { name: 'PCGamingWiki', url: 'https://www.pcgamingwiki.com',    desc: '修 bug 查配置' },
        { name: 'itch.io',      url: 'https://itch.io',                desc: '独立游戏' }
      ]
    },
    {
      title: '工具',
      items: [
        { name: 'Excalidraw', url: 'https://excalidraw.com',   desc: '随手画图' },
        { name: 'Squoosh',    url: 'https://squoosh.app',      desc: '图片压缩' },
        { name: '草料二维码',  url: 'https://cli.im',           desc: '二维码生成' },
        { name: 'Speedtest',  url: 'https://www.speedtest.net', desc: '测速' }
      ]
    }
  ]
};
