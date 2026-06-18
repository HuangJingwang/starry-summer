# Starry Summer

Starry Summer 是 Aster.H 给自己搭的一个长期内容平台，用来放文章、笔记、日常片段、项目记录、留言互动，还有一些站点自己的资产。

它不是一个作品集，也不是一个为了展示技术而存在的 demo。更像是一间慢慢整理出来的个人档案室：有些内容会认真写，有些只是随手记下，但都希望能被安静地保存下来，过几年再回头看也还能找到当时的自己。

这个站的样式和动画很大程度上参考了 [yysuni.com](https://www.yysuni.com/)。最开始做 Starry Summer 的时候，功能其实还算顺手，真正把我折磨住的是页面样式和动效：这里差一点，那里怪一点，越调越怀疑人生。后来朋友把这个博客推荐给我，我点进去看了一圈，是真的被惊艳到了。页面很简洁，动画很舒服，氛围也特别对，最重要的是：好看，好看，还是好看。

所以 Starry Summer 最后也慢慢往深色 cyber archive 的方向靠：安静一点，私人一点，读起来舒服一点。后台就不追求花哨了，中文、紧凑、实用，能让我少折腾一点、多写一点，就是它最大的价值。

## 界面预览

最新代码启动后的首页：

夜间主题：

![Starry Summer 最新运行首页夜间主题](docs/screenshots/latest-home-running.png)

白天主题：

![Starry Summer 最新运行首页白天主题](docs/screenshots/latest-home-running-day.png)

项目内置预览截图：

首页：

![Starry Summer 首页](docs/screenshots/home.png)

内容列表：

![Starry Summer 内容列表](docs/screenshots/posts.png)

后台写作：

![Starry Summer 后台写作](docs/screenshots/admin-writing.png)

## 当前方向

这个项目一开始有点像传统全栈内容系统，后来越做越发现，对一个单人博客来说，简单、可备份、可迁移更重要。所以现在它正在往“静态友好、仓库驱动”的方向收敛：

- 公开内容、站点设置、LeetCode 仪表盘和资源索引都放在 `apps/web/content`，尽量让重要东西留在仓库里。
- Next.js Web 应用负责公开页面、后台界面、认证路由，以及把内容写回仓库的发布接口。
- 后台发布时会把内容和设置写回 Git，方便以后回滚、迁移，或者单纯看看自己改过什么。
- 默认部署路径是 Vercel 托管 Web 应用，GitHub 仓库保存内容和资源。
- 文章、站点设置和后台上传的小型图片/附件都写回 GitHub 仓库；评论、留言、点赞、浏览这些高频互动再留给 Worker、KV/D1 或类似托管服务。
- 旧式数据库/API 组件不再是默认路径。不是不能做，只是现在这个站更需要轻一点、稳一点。

## 现在能做什么

- 写文章、笔记、片刻，也可以整理项目和归档。
- 用分类、标签、系列把内容慢慢串起来。
- 提供公开搜索、RSS、留言板和一些互动入口。
- 后台是中文的，主要用来管理内容、发布设置、分类，以及看一些学习仪表盘。
- Markdown 内容可以渲染，也可以从静态内容导入。
- 读者登录走 GitHub OAuth，后台会话单独管理。
- 可以用 Vercel 做主站部署，用 GitHub API 写回仓库内容。
- 有静态内容备份、恢复、健康检查和部署前检查，至少不会完全靠记忆维护。

## 技术栈

- Web: Next.js, React, TypeScript。
- 内容: JSON、Markdown 和仓库文件。
- UI: 公开站点是 dark cyber archive，后台是中文工作台。
- Workspace: npm workspaces。
- Packages: `@starry-summer/shared`、`@starry-summer/markdown`。
- Ops: Vercel、GitHub repository publishing，还有一些 shell 检查脚本。

## 目录结构

大概的目录是这样：

```text
apps/
  web/                 Next.js public site, admin UI, route handlers
  web/content/         repository-backed public content and settings
  web/public/          images and static assets
packages/
  shared/              shared domain types and helpers
  markdown/            Markdown parsing and rendering helpers
workers/
  interactions-worker/ optional hosted interaction worker
scripts/               env, smoke, backup, restore, hygiene checks
docs/                  deployment, security, migration notes, screenshots
```

## 本地开发

本地跑起来之前，需要先准备：

- Node.js 22+
- npm 10+

安装依赖：

```bash
npm install
```

启动 Web：

```bash
npm run dev
```

默认地址：

- Web: `http://127.0.0.1:3000`

平时常用的几个命令：

```bash
npm run dev:web
npm run build
npm test
npm run typecheck
```

## 环境配置

第一次本地开发时，可以用这个命令生成 `.env`、后台密码 hash 和会话密钥：

```bash
npm run ops:init-env -- "your local admin password"
```

如果只想单独生成某几个值，也可以拆开跑：

```bash
npm run auth:secret
npm run auth:interaction-secret
npm run auth:hash-password -- "your strong password"
```

GitHub OAuth 主要用于读者登录，需要这些配置：

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL`

生产部署时，至少还要准备：

- `PUBLIC_SITE_URL`
- `SESSION_SECRET`
- `GITHUB_CONTENT_OWNER`
- `GITHUB_CONTENT_REPO`
- `GITHUB_CONTENT_BRANCH`
- `GITHUB_CONTENT_TOKEN`
- `REPOSITORY_PUBLISH_SECRET`

## 内容与发布

这个站尽量把内容放在能看得见、能备份的位置。现在主要入口在这里：

```text
apps/web/content/public-content.json
apps/web/content/site-settings.json
apps/web/content/assets.json
apps/web/content/leetcode/dashboard.json
```

后台发布会用到这些 route handlers：

```text
apps/web/src/app/api/repository/content/route.ts
apps/web/src/app/api/repository/settings/route.ts
```

如果要导入掘金内容：

```bash
npm run import:juejin
```

## 生产部署

默认生产部署走 **GitHub + Vercel + 自定义域名**：

- GitHub 保存代码、文章、站点设置和后台上传的小型图片/附件。
- Vercel 运行 `apps/web` 这个 Next.js 应用。
- 域名在注册商处配置 DNS，指向 Vercel。
- 评论、留言、点赞、浏览量这类高频互动以后再接 Worker/KV/D1；当前主站不依赖它们。

### 1. 导入 Vercel 项目

在 Vercel 选择 **Add New Project**，导入 GitHub 仓库。

项目设置保持 Next.js 预设，并填写：

```text
Root Directory: apps/web
Install Command: cd ../.. && npm ci
Build Command: cd ../.. && npm run build
Output Directory: Next.js default
```

这里的 `cd ../..` 是因为项目是 monorepo，Vercel 进入 `apps/web` 后需要回到仓库根目录安装依赖和构建 workspace。

### 2. 配置生产环境变量

先在本地生成后台密码 hash 和密钥：

```bash
npm run auth:hash-password -- "your admin password"
npm run auth:secret
npm run auth:interaction-secret
```

然后在 Vercel 项目的 **Settings -> Environment Variables** 里添加：

```text
PUBLIC_SITE_URL=https://your-domain.example
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD_HASH=generated-password-hash
SESSION_SECRET=generated-session-secret
INTERACTION_HASH_SECRET=generated-interaction-secret

GITHUB_CONTENT_OWNER=your-github-owner
GITHUB_CONTENT_REPO=your-repo-name
GITHUB_CONTENT_BRANCH=main
GITHUB_CONTENT_TOKEN=github-fine-grained-token
REPOSITORY_PUBLISH_SECRET=long-random-secret

GITHUB_CLIENT_ID=github-oauth-client-id
GITHUB_CLIENT_SECRET=github-oauth-client-secret
GITHUB_CALLBACK_URL=https://your-domain.example/api/auth/github/callback
```

说明：

- `GITHUB_CONTENT_TOKEN` 使用 GitHub fine-grained personal access token，只给当前仓库权限即可。
- token 权限至少需要 `Contents: Read and write`，`Metadata: Read`。
- `GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET` 只用于读者 GitHub 登录；暂时不用读者登录时可以先留空，但相关登录能力不可用。
- 不要在 Vercel 里手动添加 `NODE_ENV`。Vercel 会自己设置生产环境，重复添加容易导致变量冲突。
- `PUBLIC_SITE_URL` 换成最终域名后，需要重新部署一次。

### 3. 绑定自定义域名

在 Vercel 项目的 **Settings -> Domains** 中添加域名，例如：

```text
asterh.me
www.asterh.me
```

如果域名在 Spaceship，进入：

```text
Domain Manager -> asterh.me -> Advanced DNS
```

添加 DNS 记录：

```text
Type: A
Host: @
Value: 76.76.21.21
TTL: Automatic
```

```text
Type: CNAME
Host: www
Value: cname.vercel-dns-0.com
TTL: Automatic
```

添加后回到 Vercel 的 Domains 页面点 **Refresh**。状态通常会经历：

```text
Invalid Configuration -> Generating SSL Certificate -> Valid Configuration
```

`Generating SSL Certificate` 表示 DNS 已经找到了 Vercel，正在签发 HTTPS 证书，等几分钟即可。

建议把短域名设为主域名：

```text
asterh.me
```

然后让 `www.asterh.me` 通过 Vercel 的 `308` 重定向到 `asterh.me`。

### 4. 自动更新流程

代码或内容更新后，有两种自动部署路径：

1. 本地提交代码并 push 到 `main`。
2. GitHub 收到 commit。
3. Vercel 自动触发 Production Deployment。
4. 新版本上线。

后台发布文章、设置或素材时：

1. 后台调用 `/api/repository/content`、`/api/repository/settings` 或 `/api/repository/assets`。
2. Web 应用用 `GITHUB_CONTENT_TOKEN` 把文件提交回 GitHub。
3. GitHub 上产生新的 commit。
4. Vercel 自动重新构建并发布。

所以这套部署不需要单独登录服务器，也不需要 Docker 或手动上传文件。

### 5. 部署后检查

部署完成后检查：

```text
https://your-domain.example
https://your-domain.example/health
https://your-domain.example/admin/login
```

也可以跑烟雾检查：

```bash
npm run ops:smoke -- https://your-domain.example
```

如果后续换域名，记得同步修改：

- Vercel 的 `PUBLIC_SITE_URL`
- GitHub OAuth App 的 callback URL
- Vercel Domains 里的主域名和重定向设置

## 运维

备份静态内容和图片：

```bash
npm run ops:backup
```

恢复时需要显式确认，免得手滑：

```bash
RESTORE_CONFIRM=YES npm run ops:restore -- backups/starry-summer-static-YYYY-MM-DD
```

健康检查和烟雾检查：

```bash
npm run ops:doctor
npm run ops:smoke
```

更细的说明放在这里：

- [部署说明](docs/deployment.md)
- [安全说明](docs/security.md)
- [静态托管迁移记录](docs/static-hosting-migration.md)
