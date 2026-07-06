export interface RecommendedShare {
  name: string;
  url: string;
  logo: string;
  avatarSrc?: string;
  avatarAlt?: string;
  description: string;
  tags: string[];
  stars: number;
}

export const categoryOrder = ['全部', '开源项目', 'AI Coding', '前端审美', '工程流程', 'AI 学习', '技术社区'];

export const recommendedShares: RecommendedShare[] = [
  {
    name: 'Taste Skill',
    url: 'https://github.com/Leonxlnx/taste-skill',
    logo: 'TS',
    avatarSrc: '/images/recommended-shares/taste-skill-avatar.jpg',
    avatarAlt: 'Taste Skill GitHub 项目图标',
    description: '给 AI 前端产物加上审美约束的开源 skill 集合，适合减少模板感，强化布局、字体、动效和间距判断。',
    tags: ['开源项目', 'AI Coding', '前端审美'],
    stars: 5,
  },
  {
    name: 'Trellis',
    url: 'https://github.com/mindfold-ai/trellis',
    logo: 'TR',
    avatarSrc: '/images/recommended-shares/trellis-avatar.jpg',
    avatarAlt: 'Trellis GitHub 项目图标',
    description: '面向 AI coding 的工程脚手架，把项目规范、任务和记忆持久化进仓库，让每次会话都带着上下文开始。',
    tags: ['开源项目', 'AI Coding', '工程流程'],
    stars: 5,
  },
  {
    name: 'Superpowers',
    url: 'https://github.com/obra/Superpowers',
    logo: 'SP',
    avatarSrc: '/images/recommended-shares/superpowers-avatar.jpg',
    avatarAlt: 'Superpowers GitHub 项目图标',
    description: '一套给 coding agents 使用的软件开发方法论，用可组合 skills 串起澄清、计划、TDD、实现和验证。',
    tags: ['开源项目', 'AI Coding', '工程流程'],
    stars: 5,
  },
  {
    name: 'Deep Research Skills',
    url: 'https://github.com/Weizhena/Deep-Research-skills',
    logo: 'DR',
    avatarSrc: '/images/recommended-shares/deep-research-skills-avatar.jpg',
    avatarAlt: 'Deep Research Skills GitHub 项目图标',
    description: '面向 Claude Code、OpenCode 和 Codex 的结构化深度研究 skill，用提纲生成、深入调研和人工确认串起更可控的研究流程。',
    tags: ['开源项目', 'AI Coding', 'AI 学习'],
    stars: 5,
  },
  {
    name: 'Conductor',
    url: 'https://github.com/zhengzizhe/conductor',
    logo: 'CO',
    avatarSrc: '/images/recommended-shares/conductor-avatar.jpg',
    avatarAlt: 'Conductor GitHub 项目图标',
    description: '原生 macOS 多终端管理器，适合把多个开发任务、Agent 会话和命令行工作流集中到一个更清晰的桌面环境里。',
    tags: ['开源项目', 'AI Coding', '工程流程'],
    stars: 5,
  },
  {
    name: 'Meetily',
    url: 'https://github.com/Zackriya-Solutions/meetily',
    logo: 'ME',
    avatarSrc: '/images/recommended-shares/meetily-avatar.jpg',
    avatarAlt: 'Meetily GitHub 项目图标',
    description: '隐私优先的开源 AI 会议助手，支持本地实时转写、会议总结和 Ollama 等模型接入，适合关注本地化 AI 工作流。',
    tags: ['开源项目', 'AI 学习', 'AI Coding'],
    stars: 5,
  },
  {
    name: '2025 Blog Public',
    url: 'https://github.com/YYsuni/2025-blog-public',
    logo: 'YY',
    avatarSrc: '/images/recommended-shares/yysuni-2025-blog-public-avatar.jpg',
    avatarAlt: '2025 Blog Public GitHub 项目图标',
    description: 'YYsuni 的开源博客项目，主打无需服务器和额外费用即可开始写 blog、管理内容，适合作为个人内容站搭建参考。',
    tags: ['开源项目', '前端审美', '工程流程'],
    stars: 5,
  },
  {
    name: 'LINUX DO',
    url: 'https://linux.do/',
    logo: 'LD',
    avatarSrc: '/images/recommended-shares/linux-do-logo.svg',
    avatarAlt: 'LINUX DO 网站图标',
    description: '活跃的中文技术社区，适合关注 AI 工具、开发经验、Linux 生态和日常工程实践的讨论与资源分享。',
    tags: ['技术社区', 'AI 学习', 'AI Coding'],
    stars: 5,
  },
  {
    name: '小林面试笔记',
    url: 'https://xiaolinnote.com/',
    logo: 'XL',
    avatarSrc: '/images/recommended-shares/xiaolinnote-logo.png',
    avatarAlt: '小林面试笔记图标',
    description: '用图解方式整理 Agent、RAG、LLM 和大模型工程高频面试题，适合作为 AI 应用开发面试前的系统复习入口。',
    tags: ['AI 学习', 'AI Coding', '工程流程'],
    stars: 5,
  },
];
