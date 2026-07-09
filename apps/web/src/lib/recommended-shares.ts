export interface RecommendedShare {
  name: string;
  url: string;
  logo: string;
  avatarSrc?: string;
  avatarAlt?: string;
  description: string;
  tags: string[];
  stars: number;
  githubStars?: number;
}

export const categoryOrder = ['全部', '开源项目', 'AI Coding', '前端审美', '工程流程', 'AI 学习', '技术社区'];

export function getRecommendedShareStars(githubStars: number) {
  if (githubStars >= 10000) {
    return 5;
  }

  if (githubStars >= 1000) {
    return 4;
  }

  return 3;
}

export const recommendedShares: RecommendedShare[] = [
  {
    name: 'Superpowers',
    url: 'https://github.com/obra/Superpowers',
    logo: 'SP',
    avatarSrc: '/images/recommended-shares/superpowers-avatar.jpg',
    avatarAlt: 'Superpowers GitHub 项目图标',
    description: '一套给 coding agents 使用的软件开发方法论，用可组合 skills 串起澄清、计划、TDD、实现和验证。',
    tags: ['开源项目', 'AI Coding', '工程流程'],
    githubStars: 247376,
    stars: getRecommendedShareStars(247376),
  },
  {
    name: 'Matt Pocock Skills',
    url: 'https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me',
    logo: 'MP',
    avatarSrc: '/images/recommended-shares/mattpocock-skills-avatar.jpg',
    avatarAlt: 'Matt Pocock Skills GitHub 项目图标',
    description: 'Matt Pocock 的开源 skills 仓库中的 grill-me skill，在动手前持续追问目标、约束和边界，逼近共识后再进入实现。',
    tags: ['开源项目', 'AI Coding', '工程流程'],
    githubStars: 161732,
    stars: getRecommendedShareStars(161732),
  },
  {
    name: 'Learn Claude Code',
    url: 'https://github.com/shareAI-lab/learn-claude-code',
    logo: 'LC',
    avatarSrc: '/images/recommended-shares/learn-claude-code-avatar.jpg',
    avatarAlt: 'Learn Claude Code GitHub 项目图标',
    description: '从 0 到 1 用 Bash 搭一个 nano 版 Claude Code agent harness，适合拆解 coding agent 的最小闭环和工具调用骨架。',
    tags: ['开源项目', 'AI Coding', 'AI 学习'],
    githubStars: 70037,
    stars: getRecommendedShareStars(70037),
  },
  {
    name: 'Taste Skill',
    url: 'https://github.com/Leonxlnx/taste-skill',
    logo: 'TS',
    avatarSrc: '/images/recommended-shares/taste-skill-avatar.jpg',
    avatarAlt: 'Taste Skill GitHub 项目图标',
    description: '给 AI 前端产物加上审美约束的开源 skill 集合，适合减少模板感，强化布局、字体、动效和间距判断。',
    tags: ['开源项目', 'AI Coding', '前端审美'],
    githubStars: 58234,
    stars: getRecommendedShareStars(58234),
  },
  {
    name: 'Meetily',
    url: 'https://github.com/Zackriya-Solutions/meetily',
    logo: 'ME',
    avatarSrc: '/images/recommended-shares/meetily-avatar.jpg',
    avatarAlt: 'Meetily GitHub 项目图标',
    description: '隐私优先的开源 AI 会议助手，支持本地实时转写、会议总结和 Ollama 等模型接入，适合关注本地化 AI 工作流。',
    tags: ['开源项目', 'AI 学习', 'AI Coding'],
    githubStars: 18223,
    stars: getRecommendedShareStars(18223),
  },
  {
    name: 'Trellis',
    url: 'https://github.com/mindfold-ai/trellis',
    logo: 'TR',
    avatarSrc: '/images/recommended-shares/trellis-avatar.jpg',
    avatarAlt: 'Trellis GitHub 项目图标',
    description: '面向 AI coding 的工程脚手架，把项目规范、任务和记忆持久化进仓库，让每次会话都带着上下文开始。',
    tags: ['开源项目', 'AI Coding', '工程流程'],
    githubStars: 11828,
    stars: getRecommendedShareStars(11828),
  },
  {
    name: '2025 Blog Public',
    url: 'https://github.com/YYsuni/2025-blog-public',
    logo: 'YY',
    avatarSrc: '/images/recommended-shares/yysuni-2025-blog-public-avatar.jpg',
    avatarAlt: '2025 Blog Public GitHub 项目图标',
    description: 'YYsuni 的开源博客项目，主打无需服务器和额外费用即可开始写 blog、管理内容，适合作为个人内容站搭建参考。',
    tags: ['开源项目', '前端审美', '工程流程'],
    githubStars: 1576,
    stars: getRecommendedShareStars(1576),
  },
  {
    name: 'Deep Research Skills',
    url: 'https://github.com/Weizhena/Deep-Research-skills',
    logo: 'DR',
    avatarSrc: '/images/recommended-shares/deep-research-skills-avatar.jpg',
    avatarAlt: 'Deep Research Skills GitHub 项目图标',
    description: '面向 Claude Code、OpenCode 和 Codex 的结构化深度研究 skill，用提纲生成、深入调研和人工确认串起更可控的研究流程。',
    tags: ['开源项目', 'AI Coding', 'AI 学习'],
    githubStars: 1528,
    stars: getRecommendedShareStars(1528),
  },
  {
    name: 'Conductor',
    url: 'https://github.com/zhengzizhe/conductor',
    logo: 'CO',
    avatarSrc: '/images/recommended-shares/conductor-avatar.jpg',
    avatarAlt: 'Conductor GitHub 项目图标',
    description: '原生 macOS 多终端管理器，适合把多个开发任务、Agent 会话和命令行工作流集中到一个更清晰的桌面环境里。',
    tags: ['开源项目', 'AI Coding', '工程流程'],
    githubStars: 86,
    stars: getRecommendedShareStars(86),
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
