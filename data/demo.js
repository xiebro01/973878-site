/* ============================================================
   仅用于「本地双击预览」（file:// 协议）的示例数据。
   线上不会加载它 —— 线上走 /api/games 与 /api/movies。
   想看真数据就部署后访问 /library/games/。
   ============================================================ */
window.DEMO = {
  games: {
    source: 'steam',
    updated: '2026-11-17',
    total: 8,
    hours: 431,
    items: [
      { id: 1245620, name: 'ELDEN RING', zh: '艾尔登法环', hours: 126.4, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/library_600x900.jpg', url: 'https://store.steampowered.com/app/1245620' },
      { id: 2358720, name: 'Black Myth: Wukong', zh: '黑神话：悟空', hours: 88.2, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2358720/library_600x900.jpg', url: 'https://store.steampowered.com/app/2358720' },
      { id: 292030, name: 'The Witcher 3: Wild Hunt', zh: '巫师3：狂猎', hours: 74.9, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/292030/library_600x900.jpg', url: 'https://store.steampowered.com/app/292030' },
      { id: 1091500, name: 'Cyberpunk 2077', zh: '赛博朋克2077', hours: 61.0, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/library_600x900.jpg', url: 'https://store.steampowered.com/app/1091500' },
      { id: 1145360, name: 'Hades', zh: '哈迪斯', hours: 39.5, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/library_600x900.jpg', url: 'https://store.steampowered.com/app/1145360' },
      { id: 367520, name: 'Hollow Knight', zh: '空洞骑士', hours: 26.8, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/367520/library_600x900.jpg', url: 'https://store.steampowered.com/app/367520' },
      { id: 268910, name: 'Cuphead', zh: '茶杯头', hours: 9.4, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/268910/library_600x900.jpg', url: 'https://store.steampowered.com/app/268910' },
      { id: 105600, name: 'Terraria', zh: '泰拉瑞亚', hours: 4.6, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/105600/library_600x900.jpg', url: 'https://store.steampowered.com/app/105600' }
    ]
  },

  movies: {
    source: 'letterboxd+neodb',
    updated: '2026-11-17',
    total: 5,
    matched: 3,
    average: 7.7,
    items: [
      { title: 'Forrest Gump', titleZh: '阿甘正传', titleEn: 'Forrest Gump', year: 1994, lb: 4.0, nd: 10, score: 9.0, watched: '2026-11-17', url: 'https://letterboxd.com/', review: null, cover: 'https://neodb.social/m/movie/2021/09/13d1567d07-417b-4b7b-8356-5d0b87f43128.jpg' },
      { title: 'Backrooms', titleZh: '后室', titleEn: 'Backrooms', year: 2026, lb: 3.5, nd: 7, score: 7.0, watched: '2026-11-15', url: 'https://letterboxd.com/', review: null, cover: null },
      { title: 'Doctor Strange in the Multiverse of Madness', titleZh: '奇异博士2：疯狂多元宇宙', titleEn: 'Doctor Strange in the Multiverse of Madness', year: 2022, lb: 3.5, nd: 6, score: 6.5, watched: '2026-11-15', url: 'https://letterboxd.com/', review: '特效很满，故事有点散，但两个小时的娱乐性是够的。', cover: null },
      { title: 'Coyote vs. Acme', titleZh: '歪心狼对阵ACME', titleEn: 'Coyote vs. Acme', year: 2026, lb: 3.5, nd: 7, score: 7.0, watched: '2026-11-06', url: 'https://letterboxd.com/', review: null, cover: null },
      { title: 'Wild Horse Nine', titleZh: null, titleEn: null, year: 2026, lb: 4.0, nd: null, score: 8.0, watched: '2026-11-09', url: 'https://letterboxd.com/', review: null, cover: null }
    ]
  }
};
