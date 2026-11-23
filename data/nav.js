/* ============================================================
   导航站数据 — 改这里就够，页面会自动渲染
   ------------------------------------------------------------
   name   显示名称（首字用作图标兜底）
   url    链接
   desc   一句话说明，越短越好
   proxy  true 表示国内通常需要代理，右侧会显示一个小圆点
   ============================================================ */
window.NAV = {
  updated: '2026-11',

  groups: [
    {
      title: '常用',
      items: [
        { name: '哔哩哔哩',  url: 'https://www.bilibili.com/', desc: '视频 · 直播' },
        { name: 'Gmail',    url: 'https://mail.google.com/mail/', desc: 'xie@973878.xyz', proxy: true },
        { name: 'GitHub',   url: 'https://github.com/xiebro01', desc: '我的仓库' },
        { name: '学校邮箱',  url: 'https://webmail.hzau.edu.cn/?q=base', desc: '华中农大 webmail' }
      ]
    },
    {
      title: 'AI',
      items: [
        { name: 'ChatGPT',  url: 'https://chatgpt.com/', desc: '通用问答', proxy: true },
        { name: 'Gemini',   url: 'https://gemini.google.com/app?hl=zh', desc: '谷歌模型', proxy: true },
        { name: 'DeepSeek', url: 'https://chat.deepseek.com/', desc: '日常主力' },
        { name: 'Artificial Analysis', url: 'https://artificialanalysis.ai/zh', desc: '模型对比与排行', proxy: true }
      ]
    },
    {
      title: '游戏',
      items: [
        { name: 'Steam',         url: 'https://store.steampowered.com/', desc: '游戏库 · 时长' },
        { name: 'SteamDB',       url: 'https://steamdb.info/',           desc: '史低与促销' },
        { name: 'SteamGridDB',   url: 'https://www.steamgriddb.com/',    desc: '封面与艺术图' },
        { name: 'Nexus 模组',     url: 'https://www.nexusmods.com/',      desc: 'MOD 下载' },
        { name: 'Humble Bundle', url: 'https://zh.humblebundle.com/',    desc: '游戏包' },
        { name: '挂刀行情',       url: 'https://csqaq.com/home',          desc: 'CS 饰品价格' },
        { name: '暗黑核',         url: 'https://www.d2core.com/',         desc: '暗黑 4 攻略与配装' },
        { name: '猎杀战绩',       url: 'https://bayouledger.com/zh',      desc: 'Hunt 对局记录' }
      ]
    },
    {
      title: '影视',
      items: [
        { name: 'NeoDB',      url: 'https://neodb.social/',     desc: '书影音游 标记' },
        { name: 'Letterboxd', url: 'https://letterboxd.com/xie73/', desc: '观影记录', proxy: true },
        { name: '咪咕视频',    url: 'https://www.miguvideo.com/', desc: '体育赛事直播' },
        { name: '腾讯体育',    url: 'https://sports.qq.com/',     desc: 'NBA 与综合' },
        { name: 'SeedHub',    url: 'https://www.seedhub.cc/',   desc: '资源站' },
        { name: '字幕库',      url: 'https://zmk.pw/',           desc: '外挂字幕' },
        { name: '97盘搜',     url: 'https://pansoo.net/',       desc: '网盘搜索' }
      ]
    },
    {
      title: '学习',
      items: [
        { name: '华农门户', url: 'https://portal-paas.hzau.edu.cn/main.html#/Index', desc: '教务 · 选课' },
        { name: '谷歌学术', url: 'https://scholar.google.com/',  desc: '论文检索', proxy: true },
        { name: '谷歌翻译', url: 'https://translate.google.com/', desc: '翻译', proxy: true }
      ]
    },
    {
      title: '外网',
      items: [
        { name: '推特',      url: 'https://x.com/home',           desc: 'X / Twitter', proxy: true },
        { name: 'Twitch',   url: 'https://www.twitch.tv/',        desc: '直播', proxy: true },
        { name: 'Instagram', url: 'https://www.instagram.com/',   desc: '图片社交', proxy: true },
        { name: '机场推荐',  url: 'https://jichangtuijian1.com/',  desc: '代理服务整理' },
        { name: '环球梯',    url: 'https://asdfla92.huanqiutt.xyz/', desc: '代理服务' },
        { name: '魔戒',      url: 'https://mojie.app/login',       desc: '代理服务' }
      ]
    }
  ]
};
