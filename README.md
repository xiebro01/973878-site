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
│   ├── games/index.html    游戏记录（待接入 Bangumi）
│   └── movies/index.html   影视记录（待接入）
├── assets/style.css        设计系统，全站共用这一份
├── data/nav.js             导航数据，加一条改一行
├── 404.html                自定义 404
├── favicon.svg
├── robots.txt              默认不让搜索引擎收录
├── _redirects              短链（/go/xxx）
├── _headers                安全头与缓存
└── shortlink-worker.js     可选：进阶短链（不影响正常使用）
```

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

`index.html` 和导航页都用的是相对路径，**直接双击就能看**。

如果想让 `/go/xxx` 这类根路径也生效（它们依赖 Cloudflare）：

```powershell
cd D:\Projects\973878
python -m http.server 8000
# 打开 http://localhost:8000
```

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

- [ ] 接入 Bangumi：游戏 + 动画记录（CORS 已确认可直接 fetch，不需要后端）
- [ ] 接入 Letterboxd 或 NeoDB：电影记录（需要一个 Pages Function 做代理）
- [ ] 可选：Cloudflare Access 保护 `/library/*`
- [ ] 可选：真想写长文时，另开 `blog.973878.xyz`

---

## 几条注意

- **不要用拖拽上传**了：已经接 Git，改一次推一次，别两套并行，容易版本错乱。
- `robots.txt` 现在是全站禁止收录（只给熟人看）。想被搜到，把那两行注释掉。
- 微信里分享 `.xyz` 链接可能被提示风险，属正常现象，不是站点问题。
