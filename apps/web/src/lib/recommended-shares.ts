export interface RecommendedShare {
  name: string;
  url: string;
  logo: string;
  description: string;
  tags: string[];
  stars: number;
}

export const categoryOrder = ['全部', '开源项目', 'AI Coding', '前端审美', '工程流程'];

export const recommendedShares: RecommendedShare[] = [
  {
    name: 'Taste Skill',
    url: 'https://github.com/Leonxlnx/taste-skill',
    logo: 'TS',
    description: '给 AI 前端产物加上审美约束的开源 skill 集合，适合减少模板感，强化布局、字体、动效和间距判断。',
    tags: ['开源项目', 'AI Coding', '前端审美'],
    stars: 5,
  },
  {
    name: 'Trellis',
    url: 'https://github.com/mindfold-ai/trellis',
    logo: 'TR',
    description: '面向 AI coding 的工程脚手架，把项目规范、任务和记忆持久化进仓库，让每次会话都带着上下文开始。',
    tags: ['开源项目', 'AI Coding', '工程流程'],
    stars: 5,
  },
  {
    name: 'Superpowers',
    url: 'https://github.com/obra/Superpowers',
    logo: 'SP',
    description: '一套给 coding agents 使用的软件开发方法论，用可组合 skills 串起澄清、计划、TDD、实现和验证。',
    tags: ['开源项目', 'AI Coding', '工程流程'],
    stars: 5,
  },
];
