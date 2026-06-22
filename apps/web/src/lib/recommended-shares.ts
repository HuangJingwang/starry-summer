export interface RecommendedShare {
  name: string;
  url: string;
  logo: string;
  description: string;
  tags: string[];
  stars: number;
}

export const categoryOrder = ['全部', '图片', '人工智能', 'CSS', 'Github', '图标', '组件', '网站集', '3D', '学习'];

export const recommendedShares: RecommendedShare[] = [
  {
    name: 'iLoveIMG',
    url: 'https://www.iloveimg.com/zh-cn',
    logo: '💙',
    description: '图片压缩、裁切、格式转换和批量处理都很顺手，适合整理博客配图前先跑一遍。',
    tags: ['图片'],
    stars: 4,
  },
  {
    name: 'TinyPNG',
    url: 'https://tinypng.com/',
    logo: '🐼',
    description: '经典图片压缩工具，压缩质量稳定，适合在发布前快速处理 PNG、JPG 和 WebP。',
    tags: ['图片'],
    stars: 3,
  },
  {
    name: 'remove.bg',
    url: 'https://www.remove.bg/zh',
    logo: '◼',
    description: 'AI 抠图工具，适合快速做头像、封面素材和演示图，免费额度适合轻量使用。',
    tags: ['图片', '人工智能'],
    stars: 3,
  },
  {
    name: 'Neumorphism',
    url: 'https://neumorphism.io/',
    logo: '▢',
    description: '新拟态 CSS 生成器，虽然不一定适合长期产品，但做视觉实验和灵感记录很有意思。',
    tags: ['CSS', 'Github'],
    stars: 2,
  },
  {
    name: 'Nucleo',
    url: 'https://nucleoapp.com/app/?library=core',
    logo: 'N',
    description: '图标库浏览体验干净，图标风格多，适合寻找一组统一且不太撞脸的图标资产。',
    tags: ['图标'],
    stars: 3,
  },
  {
    name: 'Loadership',
    url: 'https://www.loadership.com/',
    logo: '◉',
    description: 'Loader 动效集合，可以在线调整参数，适合给小工具或状态反馈找动效参考。',
    tags: ['CSS', 'Github'],
    stars: 3,
  },
  {
    name: 'CSS Buttons',
    url: 'https://cssbuttons.io/',
    logo: '∞',
    description: '按钮样式灵感库，适合快速翻找 hover、发光、拟物等小交互动效。',
    tags: ['CSS'],
    stars: 2,
  },
  {
    name: 'Uiverse',
    url: 'https://uiverse.io/',
    logo: 'UI',
    description: '组件和微交互素材很多，按钮、输入框、卡片和 loading 都适合拿来做灵感索引。',
    tags: ['CSS', '组件'],
    stars: 4,
  },
  {
    name: 'Magic UI',
    url: 'https://magicui.design/',
    logo: 'M',
    description: '围绕 shadcn/ui 的动效组件库，复制成本低，适合给个人站点加一点克制的动态细节。',
    tags: ['组件', 'Github'],
    stars: 4,
  },
  {
    name: 'Awwwards',
    url: 'https://www.awwwards.com/',
    logo: 'A',
    description: '网站设计评选与灵感库，适合观察视觉趋势、版式节奏和大胆交互方案。',
    tags: ['网站集'],
    stars: 3,
  },
  {
    name: 'Spline',
    url: 'https://spline.design/',
    logo: 'S',
    description: '在线 3D 设计工具，适合快速搭建网页里的轻量 3D 场景和动效草稿。',
    tags: ['3D'],
    stars: 4,
  },
  {
    name: 'MDN Web Docs',
    url: 'https://developer.mozilla.org/zh-CN/',
    logo: 'MDN',
    description: '前端基础知识和 API 文档的常备入口，查规范、兼容性和示例都很可靠。',
    tags: ['学习'],
    stars: 5,
  },
];
