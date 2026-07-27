# OpenAI Realtime Meeting Assistant 推荐卡片设计

## 目标

在公开站点的“推荐分享”页面新增 `openai/openai-realtime-meeting-assistant` 项目卡片，并沿用现有推荐资源的数据结构、筛选方式和视觉表现。

## 卡片内容

- 名称：`OpenAI Realtime Meeting Assistant`
- 链接：`https://github.com/openai/openai-realtime-meeting-assistant`
- 图标：下载并保存 OpenAI 的 GitHub 头像到站点本地推荐资源目录，避免依赖远程图片
- 简介：`OpenAI 官方 Realtime API 会议助手示例，通过多人 WebRTC 会议中的自然语音实时创建、移动和更新看板任务，适合学习实时语音与函数调用集成。`
- 标签：`开源项目`、`AI Coding`、`AI 学习`
- 推荐星级：两星

该卡片不保存或展示 GitHub Stars，也不增加人工评分标记或相关字段。

## 排序

卡片放在现有 GitHub 开源项目区域末尾、普通网站资源之前。这样既保留当前资源分组，也避免把两星推荐混入按 GitHub Stars 记录排列的项目中。

## 实现范围

- 更新推荐资源数据。
- 添加本地 OpenAI GitHub 头像资源。
- 更新推荐分享页面的回归测试，覆盖名称、链接、头像、标签、两星评分和排序。
- 不修改推荐卡片组件、页面布局、筛选逻辑或全局评分换算规则。

## 验证

- 运行推荐分享页面测试。
- 检查头像文件存在且可被公开路径读取。
- 运行 Web 应用类型检查，确认新增数据符合现有类型。
