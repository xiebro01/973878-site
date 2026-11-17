# 973878.xyz — 个人入口站

一个纯静态的个人主页，零依赖、零构建、零成本。
目标是：**改得动、看得懂、扔到 Cloudflare Pages 就能用**。

---

## 一、文件说明

| 文件 | 作用 | 要不要改 |
|---|---|---|
| `index.html` | 首页，所有样式和链接都在里面 | ✅ 主要改这个 |
| `blog/index.html` | 博客占位页 | ✅ 写东西时改 |
| `404.html` | 访问不存在的路径时显示 | 可选 |
| `favicon.svg` | 浏览器标签小图标 | 可选 |
| `_redirects` | 短链 / 跳转规则（`/go/xxx`） | ✅ 加短链时改 |
| `_headers` | 安全头、缓存策略 | 一般不用动 |
| `robots.txt` | 搜索引擎抓取规则 | 按需 |
| `shortlink-worker.js` | 进阶版短链（可选，需 Worker + KV） | 暂时不用管 |

> 文件夹放在 `D:\973878.xyz`，整个文件夹就是将来要上传的东西。

---

## 二、3 分钟上线（不用买服务器）

1. 打开 <https://dash.cloudflare.com>，注册 / 登录。
2. 左侧 **Workers & Pages** → **Create** → 选 **Pages** → **Upload assets**。
3. 项目名随便填，比如 `site-973878`。
4. 把 `D:\973878.xyz` 里的**所有文件**拖进上传框（`blog` 文件夹也要一起拖）。
5. **Deploy**，会得到一个 `xxx.pages.dev` 的临时地址，先点开看看效果。

到这一步，网站已经在公网上了，只是还没用你的域名。

---

## 三、把 973878.xyz 指过去

### 情况 A：DNS 已经托管在 Cloudflare（推荐，后面很多东西都依赖它）

1. Cloudflare 首页 → **Add a site** → 输入 `973878.xyz` → 选 Free 计划。
2. 它会给你两个 NS 地址（形如 `xxx.ns.cloudflare.com`）。
3. 回到 **Spaceship** → 域名管理 → Nameservers → 改成 Custom，填入这两个 NS。
4. 等生效（几分钟到几小时），Cloudflare 显示 Active 即可。

然后在 Pages 项目里：**Custom domains** → **Set up a custom domain** →
依次添加 `973878.xyz` 和 `www.973878.xyz`，Cloudflare 会自动配好 CNAME，证书也自动签发。

### 情况 B：DNS 先不动

Pages 会提示你手动加一条 CNAME：`@` → `你的项目.pages.dev`。
但很多注册商的裸域（`@`）不支持 CNAME，容易踩坑，所以更推荐情况 A。

> 换 NS 不影响域名的所有权、续费和到期时间，只影响「谁来解析」。

---

## 四、日常怎么改

### 加 / 删一个入口

打开 `index.html`，搜 `const LINKS = [`，改这一段就行：

```js
const LINKS = [
  { idx:'01', title:'博客',   desc:'写点东西，慢慢攒',    href:'/blog/',                      ext:false },
  { idx:'02', title:'GitHub', desc:'代码和半成品项目',    href:'https://github.com/yourname', ext:true  },
  { idx:'03', title:'邮箱',   desc:'hi@973878.xyz',      href:'mailto:hi@973878.xyz',        ext:false },
  { idx:'04', title:'短链演示', desc:'/go/github 这种跳转', href:'/go/github',                 ext:false },
];
```

- `ext: true` = 外部链接，新标签页打开
- 想加卡片就复制一行，`idx` 改成 `05`、`06`
- 顺序就是显示顺序

### 改文案 / 配色

- 大标题、简介：`index.html` 里 `<h1>` 和 `<p class="intro">`
- 配色：`index.html` 最上面的 `:root` 变量，`--accent` 是主色
- 想换成浅色主题：文件里已内置 `prefers-color-scheme: light`，跟随系统自动切换

### 加一条短链

编辑 `_redirects`，加一行：

```
/go/wechat    https://example.com/wechat    302
```

访问 `973878.xyz/go/wechat` 就会跳过去。改完重新上传（或 `git push`）生效。

---

## 五、免费自定义邮箱（5 分钟）

前提：域名 NS 在 Cloudflare。

1. Cloudflare 里选中 `973878.xyz` → 左侧 **Email** → **Email Routing** → **Enable**。
2. **Destination addresses** 里加你的常用邮箱（如 Gmail），去邮箱点确认链接。
3. **Routing rules** → **Custom addresses** → 新增 `hi@973878.xyz`，转发到刚才那个邮箱。
4. 想用任意前缀（`taobao@`、`steam@`、`abc@` 都收）：打开 **Catch-all**，转发到同一地址。

于是你得到一个「一址多号」的收件箱，哪个站把你的邮箱卖了，一眼就能看出来。

> 少数海外服务会拒收 `.xyz` 邮箱，注册不过就换 Gmail，别较劲。

---

## 六、本地预览

直接双击 `index.html` 就能看首页，但 `/blog/` 这种绝对路径在 `file://` 下会断。

更接近线上的方式（任选其一，在 `D:\973878.xyz` 目录里执行）：

```powershell
# 有 Python
python -m http.server 8000
# 访问 http://localhost:8000

# 有 Node
npx serve .
```

---

## 七、后续路线（按顺序做，一个一个来）

- [x] 域名到手、自动续费、域名锁、两步验证
- [ ] **阶段 1**：Pages 上线 + 绑定 973878.xyz（就是上面第二、三节）
- [ ] **阶段 2**：Email Routing 开通，`hi@` 能收信
- [ ] **阶段 3**：加 3–5 条常用短链，二维码印到名片 / 简历上
- [ ] **阶段 4**：博客真的写起来（换个静态博客生成器，或直接手写 HTML）
- [ ] **阶段 5**：NAS / 自建服务挂子域（Cloudflare Tunnel，`nas.973878.xyz`）
- [ ] **阶段 6**：决定要不要面向大陆用户做正经站点（要的话看第八节）

---

## 八、几个坑，提前知道

1. **备案**：`.xyz` 本身在工信部批复名单里，所以能备案；但**境外注册商注册的域名不能直接备案**，得先转入腾讯云 / 阿里云这类境内持牌注册商，而且注册满 60 天才能转出。
   → 不面向大陆用户，就别折腾，Cloudflare / 香港 / 新加坡 都行。
2. **微信风控**：未备案的新后缀域名在微信里分享，被拦或提示「风险网址」的概率明显更高，`.xyz` 更严。别拿它当公众号跳转主域名。
3. **大陆访问速度**：Cloudflare 免费节点在大陆时快时慢，做正经站点再考虑国内 CDN（那个要备案）。
4. **转出锁**：新注册的域名 60 天内不能转出注册商（ICANN 规定），想搬去别家要等。
5. **保留续费**：自动续费开着很好，但信用卡过期会静默失败，日历里加一个提前 30 天的提醒。

---

## 九、想再进一步可以做的东西

- 访问统计：Cloudflare Web Analytics（免费、无 Cookie、一行脚本）
- 表单 / 留言：Formspree、Cloudflare Pages Functions
- 图片：Cloudflare R2 或直接用 Pages 放静态图
- 博客引擎：Astro / Hugo / VitePress，构建产物同样扔给 Pages
- 版本管理：把这文件夹 `git init` 推到 GitHub，以后 Pages 自动构建，改一行 push 一次

---

祝你玩得开心。**973878** 这个数字，迟早会有它自己的意思。
