# 973878.xyz

个人站。三个板块：**游戏**、**影视**、**导航**。
纯静态、零依赖、无构建步骤，推到 GitHub 就自动上线。

---

## 目录

```
973878/
├── index.html              首页（三个入口）
├── nav/index.html          导航站（搜索 + 分组宫格）
├── library/
│   ├── games/index.html    游戏墙（Steam 自动同步）
│   └── movies/index.html   影视清单（Letterboxd 自动同步）
├── functions/api/
│   ├── games.js            GET /api/games   代理 Steam
│   └── movies.js           GET /api/movies  代理 Letterboxd RSS
├── assets/style.css        设计系统，全站共用这一份
├── data/nav.js             导航数据，加一条改一行
├── data/demo.js            仅本地预览用的示例数据（线上不生效）
├── 404.html                自定义 404
├── favicon.svg
├── robots.txt              默认不让搜索引擎收录
├── _redirects              短链（/go/xxx）
├── _headers                安全头与缓存
└── shortlink-worker.js     可选：进阶短链（不影响正常使用）
```

---

## 数据从哪来

两个页面都通过同源的 `/api/*` 取数，浏览器只跟自己的域名通信，**国内访问不会被墙**。

| 页面 | 接口 | 需要的环境变量 |
|---|---|---|
| 游戏 | `/api/games` | `STEAM_ID`（必填）、`STEAM_KEY`（可选） |
| 影视 | `/api/movies` | `LETTERBOXD_USER` |

配置位置：Cloudflare Pages → 项目 → **设置 → 环境变量**，加完要**重新部署**一次才生效。

### Steam

- `STEAM_ID` 填个人主页 URL 里的那段，比如 `https://steamcommunity.com/id/xiebro01` 就填 `xiebro01`；也可以直接填 17 位 SteamID64。
- 不填 `STEAM_KEY` 时走公开资料页的 XML（**不需要 key**），但前提是 Steam 隐私设置里「游戏详情」为**公开**。
- 填了 `STEAM_KEY` 会走官方 Web API，还能拿到「最近两周时长」，数据更全。
- 排查：访问 `/api/games?debug=1` 看原始返回。

### Letterboxd

- `LETTERBOXD_USER` 填个人主页 URL 里的用户名，比如 `https://letterboxd.com/xie/` 就填 `xie`。
- 数据来自公开 RSS，不需要登录、不需要 key。
- 排查：访问 `/api/movies?debug=1` 看 RSS 原文。

> NeoDB 也可以做同一件事，但它的个人数据需要 access token，更适合放在环境变量里由 `functions/api/neodb.js` 代理，需要时再加。

---

## 设计规范（改这里就能整体换风格）

所有颜色、圆角、字体都在 `assets/style.css` 顶部的 `:root` 里。

| 变量 | 值 | 用途 |
|---|---|---|
| `--bg` | `#0B0D10` | 页面底色（近黑、带蓝调） |
| `--card` | `#12161B` | 卡片底色 |
| `--line` | `rgba(255,255,255,.07)` | 唯一的分隔手段：1px 描边 |
| `--fg` | `#EDF1F5` | 主文字 |
| `--dim` | `#8894A1` | 次文字（只有两级灰） |
| `--accent` | `#E8B45C` | 强调色，只用在图标、链接、`.xyz` |
| `--r` | `12px` | 卡片圆角 |

三条铁律：

1. **不用阴影**，层次靠 1px 描边和底色差；
2. **不用 emoji 当图标**，统一用 1.5px 描边的线性 SVG；
3. **动效只做 `transform` / `opacity`，160ms**，位移不超过 2px。

---

## 常用操作

### 加一个导航站点

打开 `data/nav.js`，在对应分组里复制一行：

```js
{ name: '站点名', url: 'https://example.com', desc: '一句话说明' },
```

- `name` 决定了左侧那个方块里显示的字母（中文取首字，英文取首字母）
- 想加新分组：复制一个 `{ title: '分组名', items: [ ... ] }` 整块
- 保存后刷新即可，**不需要重新部署**（本地预览时）

### 加一条短链

编辑 `_redirects`：

```
/go/xxx    https://example.com/target    302
```

访问 `973878.xyz/go/xxx` 就会跳过去。改完要重新部署才生效。

### 改首页文案

`index.html` 里：

- 报头小字：`<p class="kicker">Personal index</p>`
- 大标题：`<h1 class="mark">`
- 一句话简介：`<p class="tagline">`
- 三张卡片：`<a class="entry">` 三块，各含图标、标题、`meta`、`p`

---

## 本地预览

**直接双击 `index.html`** 就能看首页和导航页（都用的相对路径）。

`/library/*` 两个页面在 `file://` 下会自动切到 `data/demo.js` 的示例数据，方便看设计；部署后自动改成读取真实接口。

如果想让 `/go/xxx` 这类根路径也生效（它们依赖 Cloudflare），或者想连本地接口调试：

```powershell
cd D:\Projects\973878
npx wrangler pages dev . --port 8788
# 打开 http://localhost:8788
```

（`wrangler` 会把 `functions/` 一起跑起来，但要先配好环境变量，否则接口会返回「未配置」。）

---

## 发布（GitHub Desktop）

改完文件 → 打开 GitHub Desktop → 左下角写一句说明 → **Commit to main** → **Push origin**。

约 30 秒后 Cloudflare Pages 自动构建部署。构建失败不影响线上，可在 Pages 的「部署」里回滚。

首次配置（如果换了项目）：

| 配置项 | 值 |
|---|---|
| 框架预设 | None |
| 构建命令 | 留空 |
| 构建输出目录 | `/` |

---

## 下一步

- [ ] 配好 `STEAM_ID` / `LETTERBOXD_USER`，让两个记录页出真数据
- [ ] 可选：加 `STEAM_KEY`，游戏页就能显示「最近两周在玩」
- [ ] 可选：NeoDB 也接进来（token 走环境变量 + 一个 `functions/api/neodb.js`）
- [ ] 可选：Cloudflare Access 保护 `/library/*`
- [ ] 可选：真想写长文时，另开 `blog.973878.xyz`

---

## 几条注意

- **不要用拖拽上传**了：已经接 Git，改一次推一次，别两套并行，容易版本错乱。
- `robots.txt` 现在是全站禁止收录（只给熟人看）。想被搜到，把那两行注释掉。
- 微信里分享 `.xyz` 链接可能被提示风险，属正常现象，不是站点问题。
