# Starry Summer

Starry Summer 是一个面向单人长期使用的个人内容平台。它把公开阅读站点和私有创作后台放在同一个系统里，用来沉淀文章、笔记、日常、项目、评论、留言、素材和部署资料。

这个项目的目标不是做一个短期博客模板，而是做一套可以长期维护、可备份、可迁移、可部署到云服务器的个人内容基础设施。公开页面保持深色、安静、内容优先；后台则以中文、实用、紧凑和高效为主。

## 项目特点

- 公开站点：文章、笔记、日常、项目、归档、标签、分类、系列、搜索、留言板、RSS、站点地图和关于页。
- 创作后台：内容管理、项目管理、素材管理、评论审核、留言审核、分类标签、站点设置、Markdown 导入导出。
- 内容生命周期：草稿、发布、私密、归档、恢复草稿、永久删除，以及评论、点赞和浏览统计。
- 写作体验：Markdown 编辑、实时预览、本地草稿、素材插入、封面选择和发布前设置。
- 互动边界：公开可读，评论和留言写入需要读者登录，并进入后台审核队列。
- 内容所有权：支持 Markdown 全量导出和归档导入，方便长期保存和迁移。
- 部署运维：支持 Docker Compose、Caddy、PostgreSQL、Redis、MinIO/S3 兼容存储、备份恢复和烟雾测试。

## 技术栈

- Web：Next.js、React、TypeScript
- API：NestJS、TypeScript
- 数据库：PostgreSQL
- 缓存与健康检查：Redis
- 文件存储：本地上传、MinIO 或 S3 兼容对象存储
- 部署：Docker Compose、Caddy
- Monorepo：npm workspaces，共享领域类型、数据库迁移和 Markdown 渲染能力

## 目录结构

```text
apps/
  web/  公开站点和后台界面
  api/  后端 API 服务
packages/
  shared/    共享领域类型和契约
  markdown/  Markdown 解析、渲染和导入导出辅助能力
  database/  数据库迁移、部署配置检查和数据结构测试
infra/
  caddy/     Caddy 反向代理配置
scripts/    备份、恢复、部署、体检、烟雾测试和环境初始化脚本
docs/
  deployment.md  部署和运维手册
  security.md    安全说明
  superpowers/   设计与实现计划记录
```

## 本地开发

环境要求：

- Node.js 22 或更新版本
- npm 10 或更新版本
- Docker 和 Docker Compose，用于运行接近生产环境的完整栈

安装依赖：

```bash
npm install
```

分别启动 Web 和 API：

```bash
npm run dev:web
npm run dev:api
```

默认开发地址：

- Web：http://127.0.0.1:3000
- API：http://127.0.0.1:4000

## 环境配置

首次本地 Docker 预览时，可以用脚本生成 `.env`、后台密码哈希和会话密钥：

```bash
npm run ops:init-env -- "your local admin password"
```

脚本会拒绝覆盖已有 `.env`。如果确实需要覆盖，显式设置：

```bash
INIT_ENV_OVERWRITE=YES npm run ops:init-env -- "your local admin password"
```

也可以单独生成密钥或密码哈希：

```bash
npm run auth:secret
npm run auth:interaction-secret
npm run auth:hash-password -- "your strong password"
```

留言和评论的读者登录依赖 GitHub OAuth App。需要配置：

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

OAuth 回调地址是你的公开站点域名下的 `/api/auth/github/callback`。

如果需要在首页展示最近的 LeetCode 记录，可以设置：

- `LEETCODE_USERNAME`
- `LEETCODE_RECENT_LIMIT`

## Docker 预览

启动接近生产环境的本地栈：

```bash
npm run ops:docker-preflight
docker compose build
docker compose run --rm migrate
docker compose up -d
```

常用检查：

```bash
docker compose ps
docker compose logs -f web api
```

## 验证命令

提交或部署前建议运行：

```bash
npm test
npm run typecheck
npm run build
npm run ops:docker-preflight
docker compose config --quiet
```

运维脚本测试：

```bash
npm run test:ops
```

## 部署与运维

生产路径面向自托管云服务器，核心组件包括 Docker Compose、Caddy、PostgreSQL、Redis，以及本地或 S3 兼容对象存储。

部署前检查：

```bash
npm run ops:doctor
npm run ops:docker-preflight
```

执行部署：

```bash
npm run ops:deploy -- https://blog.your-domain.com
```

备份：

```bash
npm run ops:backup
```

恢复：

```bash
RESTORE_CONFIRM=YES npm run ops:restore -- backups/starry-summer-YYYY-MM-DD
```

备份清单会记录 Docker Compose 项目标识和 SHA-256 校验值；恢复脚本会在写入 PostgreSQL 或 Docker volume 前做校验。

完整服务器配置、环境变量、Caddy 路由、备份恢复和上线流程见 [docs/deployment.md](docs/deployment.md)。

## 当前状态

Starry Summer 仍在积极开发中。当前重点是完善 V1：稳定的公开个人站点、私有后台、Markdown 内容所有权、读者互动边界、素材管理和可重复部署流程。

已批准的产品设计记录在 [docs/superpowers/specs/2026-06-10-personal-content-platform-design.md](docs/superpowers/specs/2026-06-10-personal-content-platform-design.md)。

