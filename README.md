# Starry Summer

Starry Summer 是 Aster.H 给自己搭的一座长期运行的个人内容平台。

它把博客、笔记、片刻、项目档案、留言、素材管理和部署运维收在一个仓库里。目标不是做一个通用 CMS，而是回答一个很个人但也很常见的问题：如果我想把公开写作和个人记录认真保存很多年，怎样才能既好写、好看、好迁移，又不被一套很重的服务绑住？

所以 Starry Summer 选择了比较轻的路线：内容和设置尽量落在 GitHub 仓库，Next.js 负责公开阅读和后台工作台，Vercel 负责部署，自动化脚本负责检查、备份和发布后的反馈。它更像一个可以长期打理的小型数字花园，也可以作为“个人内容平台怎么做得轻一点”的参考实现。

这个项目的视觉和动效参考过 [yysuni.com](https://www.yysuni.com/)。第一次看到的时候真的很难不心动：简洁、舒服、氛围对，而且好看。Starry Summer 后来也顺着这个方向，慢慢长成了现在的样子。

## 看一眼

最新本地运行首页：

夜间主题：

![Starry Summer 最新运行首页夜间主题](docs/screenshots/latest-home-running.png)

白天主题：

![Starry Summer 最新运行首页白天主题](docs/screenshots/latest-home-running-day.png)

项目里的几张预览：

![Starry Summer 首页](docs/screenshots/home.png)

![Starry Summer 内容列表](docs/screenshots/posts.png)

![Starry Summer 后台写作](docs/screenshots/admin-writing.png)

## 它现在怎么工作

Starry Summer 现在更偏向“静态友好、仓库驱动”的路线。对一个单人内容站来说，东西能看见、能备份、能迁移，比把架构堆得很重更重要。

![Starry Summer 仓库驱动内容流](docs/diagrams/repository-content-flow.svg)

- 公开内容、站点设置、LeetCode 仪表盘和资源索引主要放在 `apps/web/content`。
- Next.js 负责公开页面、后台界面、登录、发布接口和构建。
- 后台发布文章、设置或素材时，会把文件写回 GitHub 仓库。
- 代码或内容 push 到 `main` 后，Vercel 会自动部署新版本。
- 评论、留言、点赞、浏览量这类高频互动，可以交给 Worker、KV/D1 或类似托管服务。
- 旧的数据库/API 组件已经不是默认路线；不是不能用，只是现在这座小站更适合轻一点。

## 现在能做什么，之后还能做什么

已经具备的能力：

- 写文章、笔记、片刻，整理项目和归档。
- 用分类、标签、系列把内容串起来。
- 提供公开搜索、RSS、留言板和一些互动入口。
- 在中文后台里管理内容、发布设置、分类和学习仪表盘。
- 渲染 Markdown，也支持从静态内容导入。
- 用 GitHub OAuth 做读者登录，后台会话单独管理。
- 用 GitHub 保存内容和素材，用 Vercel 部署主站。
- 提供备份、恢复、健康检查和部署前检查，尽量少靠记忆维护。
- 用 Codex post-push watcher 跟踪 push 后的 CI、PR 和 Vercel 部署状态。

以后可能继续补上的方向：

- 更完整的公开互动：评论、留言、点赞、浏览量和通知可以进一步接入 Worker、KV/D1 或其他托管存储。
- 更舒服的写作流：草稿、预览、素材引用、Markdown 导入和批量整理还可以继续打磨。
- 更清晰的内容关系：系列、专题、时间线、引用关系和阅读路径可以做得更像个人知识库。
- 更自动的运维反馈：部署成功后的 smoke、失败后的上下文收集、回滚建议和本地 Codex 提醒可以继续完善。
- 更好的可复用性：把 Starry Summer 的仓库驱动内容模型、部署检查和 Codex watcher 提炼成更容易迁移的模板。

## 技术栈

- Web: Next.js, React, TypeScript
- 内容: JSON, Markdown, repository-backed files
- UI: public light/dark themes with cyber archive atmosphere, admin Chinese workspace
- Workspace: npm workspaces
- Packages: `@starry-summer/shared`, `@starry-summer/markdown`
- Ops: Vercel, GitHub repository publishing, shell checks

## 目录

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

## 本地跑起来

需要：

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

```text
http://127.0.0.1:3000
```

常用命令：

```bash
npm run dev:web
npm run build
npm test
npm run typecheck
```

## 第一次配置

可以一条命令生成本地 `.env`、后台密码 hash 和会话密钥：

```bash
npm run ops:init-env -- "your local admin password"
```

也可以拆开生成：

```bash
npm run auth:secret
npm run auth:interaction-secret
npm run auth:hash-password -- "your strong password"
```

GitHub OAuth 用于读者登录：

```text
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
GITHUB_CALLBACK_URL
```

生产环境还需要这些核心变量：

```text
PUBLIC_SITE_URL
SESSION_SECRET
GITHUB_CONTENT_OWNER
GITHUB_CONTENT_REPO
GITHUB_CONTENT_BRANCH
GITHUB_CONTENT_TOKEN
REPOSITORY_PUBLISH_SECRET
```

完整配置看 [部署说明](docs/deployment.md) 和 [安全说明](docs/security.md)。

## 内容放在哪里

主要内容入口：

```text
apps/web/content/public-content.json
apps/web/content/site-settings.json
apps/web/content/assets.json
apps/web/content/leetcode/dashboard.json
```

后台发布会用到这些接口：

```text
apps/web/src/app/api/repository/content/route.ts
apps/web/src/app/api/repository/settings/route.ts
apps/web/src/app/api/repository/assets/route.ts
```

导入掘金内容：

```bash
npm run import:juejin
```

## 部署

默认生产路线是 **GitHub + Vercel + 自定义域名**：

![Starry Summer 部署与反馈流](docs/diagrams/deployment-feedback-flow.svg)

1. GitHub 保存代码、文章、站点设置和小型素材。
2. Vercel 运行 `apps/web` 这个 Next.js 应用。
3. 自定义域名指向 Vercel。
4. 每次 push 到 `main`，Vercel 自动构建并上线最新版本。

Vercel 项目设置：

```text
Root Directory: apps/web
Install Command: cd ../.. && npm ci
Build Command: cd ../.. && npm run build
Output Directory: Next.js default
```

这里需要 `cd ../..`，因为 Vercel 进入 `apps/web` 后，要回到仓库根目录安装依赖和构建 workspace。

生产环境变量大致包括：

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

小提醒：

- `GITHUB_CONTENT_TOKEN` 建议用 fine-grained personal access token。
- token 至少需要 `Contents: Read and write`、`Metadata: Read`。
- 不要在 Vercel 里手动添加 `NODE_ENV`，让 Vercel 自己管。
- 换域名后，记得同步改 `PUBLIC_SITE_URL` 和 GitHub OAuth callback URL。

部署完可以检查：

```text
https://your-domain.example
https://your-domain.example/health
https://your-domain.example/admin/login
```

或者跑：

```bash
npm run ops:smoke -- https://your-domain.example
```

更完整的步骤放在 [部署说明](docs/deployment.md)。

## 备份和检查

备份静态内容和图片：

```bash
npm run ops:backup
```

恢复时需要显式确认：

```bash
RESTORE_CONFIRM=YES npm run ops:restore -- backups/starry-summer-static-YYYY-MM-DD
```

健康检查和烟雾检查：

```bash
npm run ops:doctor
npm run ops:smoke
```

## Codex post-push watcher

这个项目还带了一套可以单独参考的 **Codex post-push watcher**。

它适合这样的工作流：代码主要由本地 Codex push 到 GitHub，push 后希望自动跟踪这次提交的 GitHub Actions、PR 合并状态和 Vercel 部署结果，但又不想全天跑定时任务，也不想为了 GitHub Actions 里的 Codex 自动修复额外准备 OpenAI API key。

大致流程是：

```text
Codex 执行 git push
  -> 本地 Codex PostToolUse hook 识别成功 push
  -> 启动短生命周期 watcher
  -> watcher 通过 gh 查询 GitHub checks / PR / Vercel 状态
  -> 结果写入 .codex/local/post-push-status.jsonl，并尽量发本地通知
```

这套功能的说明在 [Codex post-push watcher](docs/ops/codex-post-push-watcher.md)。如果想把这个模式迁移到别的仓库，可以参考项目内 skill：`.codex/skills/codex-post-push-watcher/SKILL.md`。

## 相关文档

- [部署说明](docs/deployment.md)
- [安全说明](docs/security.md)
- [静态托管迁移记录](docs/static-hosting-migration.md)
- [Codex post-push watcher](docs/ops/codex-post-push-watcher.md)
