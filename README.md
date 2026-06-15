# Starry Summer

Starry Summer 是面向单人长期写作和公开沉淀的个人内容平台。公开站点保持深色 cyber archive 气质，后台以中文、实用、紧凑的内容管理为主。

当前默认方向是数据库无关的静态/仓库驱动方案：

- 公开内容、站点设置、LeetCode 仪表盘从 `apps/web/content` 读取。
- 后台内容和设置发布通过 Next 仓库路由提交到 Git 仓库。
- 默认 Docker Compose 只运行 `web` 和 `caddy`。
- 评论、留言、点赞、浏览、资产上传等动态能力应接入 Worker、KV/D1、R2 或类似托管服务。
- 旧 Nest API、PostgreSQL、Redis、MinIO 不再属于默认开发、构建或部署路径。

## 技术栈

- Web: Next.js, React, TypeScript
- 内容: Markdown, JSON, repository files
- 动态边界: Next route handlers for auth and repository publishing
- 部署: Docker Compose, Caddy, static-friendly hosting
- Monorepo: npm workspaces for `apps/web`, `packages/markdown`, `packages/shared`

## 目录结构

```text
apps/
  web/        public site, admin UI, Next route handlers
packages/
  shared/     shared domain types and helpers
  markdown/   Markdown parsing and rendering helpers
workers/      optional hosted interaction and asset workers
infra/
  caddy/      Caddy reverse proxy config
scripts/      deploy, smoke, backup, restore, env initialization
docs/
  deployment.md
  static-hosting-migration.md
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

## Docker 预览

```bash
npm run ops:docker-preflight
docker compose build
docker compose up -d
```

常用检查：

```bash
docker compose ps
docker compose logs -f web caddy
```

## 验证命令

提交或部署前建议运行：

```bash
npm test
npm run typecheck
npm run build
docker compose config --quiet
```

## 部署与备份

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

完整说明见 [docs/deployment.md](docs/deployment.md)。

## 开源与安全

Starry Summer 使用 MIT License。请不要提交真实账号、密码 hash、OAuth 密钥、生产数据、私人姓名、上传素材或本地参考导入目录。
