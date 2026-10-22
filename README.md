# 陈立晖 · 十九岁生日快乐

一个纯静态、零外部依赖的生日祝福网站。深墨蓝夜色、香槟金与灰粉玫瑰，核心是一只手绘质感的三层生日蛋糕。页面收件人为「陈立晖」，年龄为「19」。

## 当前公网地址

<https://kathris612.github.io/chenlihui19birthday/>

站点已发布在 GitHub Pages，其他电脑可直接访问。自定义域名 `www.mxjk18birthday.com` 目前尚未注册/解析，后续可按下方说明绑定。

- 入口即见：生日蛋糕、点燃的蜡烛与「生日快乐」祝福
- 点击「许个愿 · 吹蜡烛」：烛火熄灭、飘出轻烟、烟花与彩纸落下
- 点击蛋糕：撒下一小簇金色星光
- 右上角「音乐」：浏览器实时合成的音乐盒旋律，不加载任何音频文件
- 响应式布局，支持手机、平板与桌面
- 尊重系统「减少动态效果」设置

## 本地预览

```bash
cd mxjk18birthday
python -m http.server 8088
```

打开 <http://127.0.0.1:8088/>。

当前工作区已启动了一个预览服务：<http://127.0.0.1:8088/>。

## 绑定自定义域名（可选）

GitHub Pages 公网地址已经可用。若之后注册了域名并希望使用 `www.mxjk18birthday.com`，需要两步：**完成域名注册**，以及**把域名的 DNS 指向托管平台**。仓库中的 `CNAME` 文件预留给自定义域名，但当前 GitHub Pages 发布版本没有包含它，否则 `github.io` 地址会被重定向到尚未解析的域名。

### 方案 A：Cloudflare Pages（推荐，免费且自带 HTTPS）

1. 注册 / 登录 Cloudflare，进入 **Workers & Pages → Create → Pages**。
2. 选择 **Upload assets**，上传整个 `mxjk18birthday` 文件夹（或连接 Git 仓库）。
3. 部署成功后，在 **Custom domains** 添加 `www.mxjk18birthday.com`。
4. 按 Cloudflare 提示在域名 DNS 中添加 `www` 的 CNAME 记录；开启 HTTPS。
5. 建议把根域名 `mxjk18birthday.com` 301 重定向到 `www.mxjk18birthday.com`。

### 方案 B：Netlify（拖拽即上线）

1. 打开 <https://app.netlify.com/drop>，把 `mxjk18birthday` 文件夹拖进去。
2. 在 **Domain management** 添加 `www.mxjk18birthday.com`。
3. 按提示添加 CNAME 记录并启用 HTTPS。

### 方案 C：GitHub Pages

1. 把整个目录推到 GitHub 仓库。
2. 在 **Settings → Pages** 中选择分支和根目录。
3. 在 Custom domain 填入 `www.mxjk18birthday.com`，仓库里的 `CNAME` 会自动生效。
4. 在域名服务商处添加 CNAME：`www` → `<你的用户名>.github.io`。

### 域名与备案提醒

- 如果域名还没注册，可先在 Cloudflare、阿里云、腾讯云或 Namecheap 注册。
- `www` 通常使用 CNAME 指向托管平台；根域名用平台提供的 A 记录或 301 跳转。
- 如果部署在中国大陆服务器 / 对象存储上，需要完成 ICP 备案；使用 Cloudflare Pages、Netlify 等境外托管通常不需要备案，但访问速度会受网络影响。
- 域名解析生效通常需要几分钟到几小时；HTTPS 证书一般由托管平台自动签发。

## 文件结构

```text
mxjk18birthday/
├─ index.html          页面结构 + 手绘 SVG 蛋糕
├─ 404.html            同风格 404 页面
├─ css/
│  └─ style.css        视觉、动画与响应式布局
├─ js/
│  └─ main.js          星光、烟花、吹蜡烛、音乐与视差
├─ assets/
│  ├─ favicon.svg
│  └─ grain.svg
├─ og-image.png        1200 × 630 社交分享图
├─ CNAME               GitHub Pages 域名
├─ robots.txt
├─ sitemap.xml
├─ _headers            Cloudflare Pages / Netlify 安全响应头
└─ README.md
```

## 修改成你的专属版本

### 1. 改名字和年龄

全局搜索 `陈立晖`，替换成收件人的名字或缩写。年龄出现在：

- `index.html` 中的 `19`、`NINETEEN`、`01 / 19`
- `js/main.js` 中的蜡烛交互与音乐无关，可不动
- `404.html` 的标题与装饰数字
- `CNAME` / `robots.txt` / `sitemap.xml` / `README.md` 中的域名

### 2. 改祝福语

在 `index.html` 中搜索：

- `十九岁，是风开始有了方向，`
- `愿你此后的每一天，`
- `愿望已被星光收好。十九岁的你，请继续发光。`

### 3. 改配色

`css/style.css` 顶部的 `:root` 变量：

```css
--ink: #090b11;          /* 背景 */
--gold: #d6b37a;         /* 金色 */
--ivory: #f7ede1;        /* 象牙白 */
--rose: #d6a39d;         /* 灰粉 */
```

### 4. 替换蛋糕

蛋糕是 `index.html` 里的内联 SVG，从 `<svg class="cake-svg"` 开始到 `</svg>` 结束。若要换成真实照片，可以把这一整段替换成 `<img src="assets/cake.jpg" alt="生日蛋糕">`，再在 CSS 中调整 `.cake-svg` 的宽度规则。保留蜡烛火焰动画则需要继续使用 SVG。

### 5. 更新分享图

替换 `og-image.png`（建议 1200 × 630），并把 `index.html` 的 `og:image` 保持为：

```text
https://kathris612.github.io/chenlihui19birthday/og-image.png
```

## 技术说明

- 无构建步骤、无第三方 CDN、无外部字体请求；断网也能完整打开。
- 音乐通过 Web Audio API 实时合成，首次点击「音乐」后才创建音频上下文，符合浏览器自动播放限制。
- 所有动画都使用 CSS / Canvas，并为 `prefers-reduced-motion: reduce` 提供静态版本。
- 没有 Cookie、统计脚本或表单，不收集访问者数据。
