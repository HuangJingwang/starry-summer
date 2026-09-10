# Starry Summer 公开网站重设计

日期：2026-09-10，Asia/Shanghai。

## 范围

依据 MotionSites 的立体人物与大字叠层构图，以及 React Bits 的 Dock、Tilted Card、Spotlight Card、Scroll Stack 交互思路。Taste Skill 使用 Overhaul 模式：首页设计参数 8/7/4，列表与正文减少动态。使用已有 React、TypeScript、framer-motion、Lucide 和原生 CSS，没有引入 GSAP、Lenis、Tailwind 或新的后端。

- 正式首页使用共享公共框架。首屏、最近文章、个人项目、推荐分享、页脚依次排列。
- 全站 Dock 固定为首页、文章、项目、推荐分享、搜索。使用真实链接、当前页状态、键盘方向键与手机文字标签。
- 文章列表新增关键词、分类/标签筛选及每页 12 条分页，查询保留在 URL；改变排序保留筛选，返回页面恢复 URL 和浏览器滚动。
- 推荐页保留 `/moments` 以及现有全部 20 项资源，增加网站/开源项目筛选，支持搜索、分类、清空和 URL 恢复。首页精选 6 项，未删除其他条目。
- 保留 3 个个人项目，项目与推荐开源资源分开。项目详情、文章详情沿用原有内容与阅读功能。
- 关于页使用与首页一致的角色。分类、专题、标签、归档、搜索、404 和停用留言页使用统一主题与框架。
- 双主题保留，暗色为冷灰与青色，浅色为冷白与深青色；动效遵守减少动态偏好，手机取消倾斜与叠卡。
- 保留图片预览、代码复制、目录、阅读进度、相关内容以及按现有配置启用的互动能力。

管理后台、内容数据、既有 URL、RSS、SEO 与互动服务配置未迁移。`/creative-preview` 保留为旧实验地址，正式入口是 `/`。

## 资产与来源

### 已确认的 Aster 形象

首页和关于页现使用 `apps/web/public/images/aster-avatar.webp` 及 640/960 响应式版本。站主确认了黑色短发、深色卫衣、坐在方块上手持笔记本的卡通版本；不是后续年龄调整版本，也不是真人脸贴图。

此版本从站主选定的原图进行本地前景分割，修复坐凳遮罩并清理灰边。透明 PNG 仅改变 alpha，RGB 像素与选定原图逐像素一致；网页 WebP 是保留透明通道的压缩派生图。原始人物照片不进入仓库。本站项目卡片中的截图也随形象更新。下方银发形象说明作为初版素材记录保留，不再用于正式首页或关于页。

- `apps/web/public/images/editorial-writer.webp` 及 640/960 响应式版本：通过内置图像生成工具生成的原创角色渲染图，透明背景。网页通过分层和倾斜实现 2.5D 效果，**不是可旋转的 3D 模型**，也不是站主真人肖像。
- `apps/web/public/images/editorial-pipecat-cover.webp`：现有 Pipecat 封面的轻量首页派生版本，原文章封面和正文图片未修改。
- `apps/web/public/images/projects/brushup-dashboard.webp`：来自 [BrushUp 原仓库截图](https://raw.githubusercontent.com/HuangJingwang/brushup/master/screenshots/dashboard.png)，压缩为 WebP；图中为仓库提供的历史演示数据。
- `apps/web/public/images/projects/starry-summer-home.webp`：本次实现后本地首页的实际截图。
- easy-yapi-micronaut 无可用界面截图，使用既有项目标识，不将标识称为产品截图。

角色最终生成提示词：

> Use case: stylized-concept. Asset type: transparent hero character cutout for Starry Summer personal technical blog. Create one original sculptural 3D character, NOT a real person or portrait: an adult-proportioned anonymous writer in a charcoal oversized hoodie, silver-gray sculpted hair, understated round glasses, stylized friendly face, sitting sideways with one knee raised and a closed slim silver notebook held loosely, looking toward viewer left. Highly polished designer vinyl collectible / cinema 4D studio render, sophisticated not childish, tactile matte fabric and satin silver highlights with tiny muted cyan details. Three-quarter full body pose, compelling asymmetrical silhouette, center framing, all head hands and feet inside frame with 8% margin. Soft studio key light and crisp cool edge light, readable on both off-white and near-black webpages. Truly transparent background with alpha, no floor rectangle or backdrop, no surrounding elements, no floating shapes, no text, no logos, no watermark. The asset will overlap a large typographic hero, not a full scene. Output square 1024px.

实际返回尺寸为 1254×1254；编码优化保留透明通道，没有改绘图像内容。

## 验证范围

自动测试覆盖内容可见性、全部推荐保留、筛选与空状态、分页边界、排序保留查询、URL 恢复、Dock 键盘操作和样式契约。

浏览器检查覆盖桌面 1440px、手机 390px，明暗两种主题：`/`、`/posts`、`/notes`、`/moments`、`/projects`、`/series`、`/categories`、`/tags`、`/archives`、`/search`、`/guestbook`、`/about`、文章详情、项目详情与 404。

实际操作验证：推荐类型筛选、搜索、刷新恢复、清空；文章分页、关键词筛选、进入详情和返回；图片放大与 Escape；代码剪贴板；主题切换；桌面叠卡；手机与减少动态模式降级。未向线上互动服务写入测试评论或点赞。

## 部署边界

保留现有 Next.js standalone 配置和提交触发部署方式。首页、文章列表、推荐目录等可预渲染；阅读详情、搜索和部分已有路由仍由 Next.js 服务处理。没有将整个应用改成 `output: export`，不能把本次改造解释成纯静态 HTML 迁移。

未配置互动服务时，继续显示现有不可用/关闭状态，不伪造评论提交成功，不重新开启已停用的留言功能。
