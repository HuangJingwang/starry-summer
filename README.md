# Starry Summer

Starry Summer 是 Aster.H 的单人长期内容平台，用来公开沉淀文章、笔记、日常片段、项目、留言互动和站点资产。

公开站点偏向深色 cyber archive：安静、个人、可阅读、内容优先。后台管理界面保持中文、紧凑、实用，服务于持续写作和发布，而不是一次性的作品展示。

## 界面预览

首页：

![Starry Summer 首页](docs/screenshots/home.png)

内容列表：

![Starry Summer 内容列表](docs/screenshots/posts.png)

后台写作：

![Starry Summer 后台写作](docs/screenshots/admin-writing.png)

## 当前方向

项目正在从传统全栈内容系统收敛为静态友好、仓库驱动的个人站点：

- 公开内容、站点设置、LeetCode 仪表盘和资源索引存放在 `apps/web/content`。
- Next.js Web 应用负责公开页面、后台界面、认证路由和仓库发布路由。
- 后台发布会把内容和设置写回 Git 仓库，方便版本管理和迁移。
- 默认 Docker Compose 只运行 `web` 与 `caddy`。
- 评论、留言、点赞、浏览、资产上传等动态能力预留给 Worker、KV/D1、R2 或类似托管服务。
- 旧式数据库/API 组件不再是默认本地开发和部署路径。

## 功能范围

- 文章、笔记、片刻、项目和归档页面
- 分类、标签、系列等内容组织方式
- 公开搜索、RSS、留言板和互动入口
- 中文后台内容管理、发布设置、分类管理和学习仪表盘
- Markdown 内容渲染与静态内容导入
- GitHub OAuth 读者登录与后台会话
- Docker + Caddy 生产预览和部署脚本
- 静态内容备份、恢复、健康检查和部署前检查

## 技术栈

- Web: Next.js, React, TypeScript
- 内容: JSON, Markdown, repository files
- UI: public cyber archive theme, Chinese admin workbench
- Workspace: npm workspaces
- Packages: `@starry-summer/shared`, `@starry-summer/markdown`
- Ops: Docker Compose, Caddy, shell smoke checks

## 目录结构

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

环境要求：

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

常用脚本：

```bash
npm run dev:web
npm run build
npm test
npm run typecheck
```

## 环境配置

生成本地 `.env`、后台密码 hash 和会话密钥：

```bash
npm run ops:init-env -- "your local admin password"
```

单独生成密钥：

```bash
npm run auth:secret
npm run auth:interaction-secret
npm run auth:hash-password -- "your strong password"
```

GitHub OAuth 用于读者登录：

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL`

生产部署还需要至少设置：

- `PUBLIC_SITE_URL`
- `SESSION_SECRET`
- `DOMAIN`
- `ACME_EMAIL`

## 内容与发布

仓库内容入口：

```text
apps/web/content/public-content.json
apps/web/content/site-settings.json
apps/web/content/assets.json
apps/web/content/leetcode/dashboard.json
```

后台发布相关 route handlers 位于：

```text
apps/web/src/app/api/repository/content/route.ts
apps/web/src/app/api/repository/settings/route.ts
```

导入掘金内容：

```bash
npm run import:juejin
```

## Docker 预览

```bash
npm run ops:docker-preflight
docker compose build
docker compose up -d
```

查看状态和日志：

```bash
docker compose ps
docker compose logs -f web caddy
```

校验 Compose 配置：

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

恢复：

```bash
RESTORE_CONFIRM=YES npm run ops:restore -- backups/starry-summer-static-YYYY-MM-DD
```

健康和烟雾检查：

```bash
npm run ops:doctor
npm run ops:smoke
```

更多说明见：

- [部署说明](docs/deployment.md)
- [安全说明](docs/security.md)
- [静态托管迁移记录](docs/static-hosting-migration.md)

## 提交前检查

常规检查：

```bash
npm test
npm run typecheck
npm run build
docker compose config --quiet
```

较窄的前端样式回归可运行：

```bash
npm test --workspace @starry-summer/web -- styles.test.ts
```

## 安全边界

- 不提交真实账号、密码 hash、OAuth 密钥、生产数据或私人素材。
- 不在公开页面、RSS 元数据、默认设置或迁移数据里暴露站主真实姓名。
- 公开展示名使用 `Aster.H`。
- 后台界面默认面向单人维护，不作为多租户 CMS 设计。
- 动态互动能力应优先通过托管 Worker/KV/R2 等边界接入，不把生产私密状态混进仓库内容。

## License

MIT
