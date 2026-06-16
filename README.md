# Starry Summer

Starry Summer 是 Aster.H 给自己搭的一个长期内容平台，用来放文章、笔记、日常片段、项目记录、留言互动，还有一些站点自己的资产。

它不是一个作品集，也不是一个为了展示技术而存在的 demo。更像是一间慢慢整理出来的个人档案室：有些内容会认真写，有些只是随手记下，但都希望能被安静地保存下来，过几年再回头看也还能找到当时的自己。

这个站的样式和动画很大程度上参考了 [yysuni.com](https://www.yysuni.com/)。最开始做 Starry Summer 的时候，功能其实还算顺手，真正把我折磨住的是页面样式和动效：这里差一点，那里怪一点，越调越怀疑人生。后来朋友把这个博客推荐给我，我点进去看了一圈，是真的被惊艳到了。页面很简洁，动画很舒服，氛围也特别对，最重要的是：好看，好看，还是好看。

所以 Starry Summer 最后也慢慢往深色 cyber archive 的方向靠：安静一点，私人一点，读起来舒服一点。后台就不追求花哨了，中文、紧凑、实用，能让我少折腾一点、多写一点，就是它最大的价值。

## 当前方向

这个项目一开始有点像传统全栈内容系统，后来越做越发现，对一个单人博客来说，简单、可备份、可迁移更重要。所以现在它正在往“静态友好、仓库驱动”的方向收敛：

- 公开内容、站点设置、LeetCode 仪表盘和资源索引都放在 `apps/web/content`，尽量让重要东西留在仓库里。
- Next.js Web 应用负责公开页面、后台界面、认证路由，以及把内容写回仓库的发布接口。
- 后台发布时会把内容和设置写回 Git，方便以后回滚、迁移，或者单纯看看自己改过什么。
- 默认 Docker Compose 只跑 `web` 和 `caddy`，够用就好。
- 评论、留言、点赞、浏览、资产上传这些动态能力会留给 Worker、KV/D1、R2 或类似托管服务，不急着把所有东西都塞进主应用。
- 旧式数据库/API 组件不再是默认路径。不是不能做，只是现在这个站更需要轻一点、稳一点。

## 现在能做什么

- 写文章、笔记、片刻，也可以整理项目和归档。
- 用分类、标签、系列把内容慢慢串起来。
- 提供公开搜索、RSS、留言板和一些互动入口。
- 后台是中文的，主要用来管理内容、发布设置、分类，以及看一些学习仪表盘。
- Markdown 内容可以渲染，也可以从静态内容导入。
- 读者登录走 GitHub OAuth，后台会话单独管理。
- 可以用 Docker + Caddy 做生产预览和部署。
- 有静态内容备份、恢复、健康检查和部署前检查，至少不会完全靠记忆维护。

## 技术栈

- Web: Next.js, React, TypeScript。
- 内容: JSON、Markdown 和仓库文件。
- UI: 公开站点是 dark cyber archive，后台是中文工作台。
- Workspace: npm workspaces。
- Packages: `@starry-summer/shared`、`@starry-summer/markdown`。
- Ops: Docker Compose、Caddy，还有一些 shell 检查脚本。

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
  assets-worker/       optional hosted asset worker
  interactions-worker/ optional hosted interaction worker
infra/
  caddy/               Caddy reverse proxy config
scripts/               env, deploy, smoke, backup, restore, hygiene checks
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
- `DOMAIN`
- `ACME_EMAIL`

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

## Docker 预览

想用接近生产的方式看一眼，可以跑 Docker 预览：

```bash
npm run ops:docker-preflight
docker compose build
docker compose up -d
```

看状态和日志：

```bash
docker compose ps
docker compose logs -f web caddy
```

改过 Compose 配置后，记得校验一下：

```bash
docker compose config --quiet
```

## 部署与运维

部署：

```bash
npm run ops:deploy -- https://blog.your-domain.com
```

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
