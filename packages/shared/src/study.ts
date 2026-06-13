export type StudyDifficulty = '简单' | '中等' | '困难';

export type StudyProblemListId = 'hot100' | 'offer75' | 'top150';

export type StudyReportPeriod = 'week' | 'month';

export interface StudySettings {
  leetcodeUsername: string;
  activeListId: StudyProblemListId;
  roundCount: number;
  reviewIntervals: number[];
  dailyNew: number;
  dailyReview: number;
  deadline: string;
  updatedAt: string;
}

export interface StudyProblem {
  number: number;
  title: string;
  slug: string;
  difficulty: StudyDifficulty;
  category: string;
  listIds: StudyProblemListId[];
  rounds: string[];
  notes: string;
  solutionViewed: boolean;
  mustRepeat: boolean;
  timeSpentSeconds: number[];
  updatedAt: string;
}

export type StudySettingsPatch = Partial<Pick<
  StudySettings,
  'leetcodeUsername' | 'activeListId' | 'roundCount' | 'reviewIntervals' | 'dailyNew' | 'dailyReview' | 'deadline'
>>;

export type StudyProblemPatch = Partial<Pick<
  StudyProblem,
  | 'number'
  | 'title'
  | 'difficulty'
  | 'category'
  | 'listIds'
  | 'rounds'
  | 'notes'
  | 'solutionViewed'
  | 'mustRepeat'
  | 'timeSpentSeconds'
>>;

export interface StudySubmission {
  title: string;
  titleSlug: string;
  status: string;
  language: string;
  submittedAt: string;
  submittedAtLabel: string;
  problemUrl: string;
}

export interface StudySummary {
  totalProblems: number;
  startedProblems: number;
  completedProblems: number;
  doneRounds: number;
  totalRounds: number;
  completionRate: number;
  streak: number;
  totalDays: number;
  lastActivityDate: string;
}

export interface StudyCategoryProgress {
  name: string;
  total: number;
  started: number;
  completed: number;
  rate: number;
}

export interface StudyTask {
  slug: string;
  title: string;
  difficulty: StudyDifficulty;
  category: string;
}

export interface StudyReviewTask extends StudyTask {
  nextRound: string;
  dueDate: string;
  overdueDays: number;
}

export interface StudyHeatmapDay {
  date: string;
  count: number;
}

export interface StudyDashboard {
  settings: StudySettings;
  summary: StudySummary;
  categories: StudyCategoryProgress[];
  problems: StudyProblem[];
  todayFocus: StudyTask[];
  reviewDue: StudyReviewTask[];
  heatmap: StudyHeatmapDay[];
  recentSubmissions: StudySubmission[];
  recentNotes: StudyProblem[];
}

export const DEFAULT_STUDY_SETTINGS: StudySettings = {
  leetcodeUsername: '',
  activeListId: 'hot100',
  roundCount: 5,
  reviewIntervals: [1, 3, 7, 14],
  dailyNew: 3,
  dailyReview: 5,
  deadline: '',
  updatedAt: '',
};

export const STUDY_LIST_LABELS: Record<StudyProblemListId, string> = {
  hot100: 'Hot 100',
  offer75: '剑指 Offer 75',
  top150: 'Top Interview 150',
};

export const DEFAULT_STUDY_PROBLEMS: StudyProblem[] = [
  createDefaultStudyProblem(1, '两数之和', 'two-sum', '简单', '哈希表', ['hot100', 'top150']),
  createDefaultStudyProblem(3, '无重复字符的最长子串', 'longest-substring-without-repeating-characters', '中等', '滑动窗口', ['hot100', 'top150']),
  createDefaultStudyProblem(20, '有效的括号', 'valid-parentheses', '简单', '栈', ['hot100', 'top150']),
  createDefaultStudyProblem(21, '合并两个有序链表', 'merge-two-sorted-lists', '简单', '链表', ['hot100', 'top150']),
  createDefaultStudyProblem(46, '全排列', 'permutations', '中等', '回溯', ['hot100', 'top150']),
  createDefaultStudyProblem(53, '最大子数组和', 'maximum-subarray', '中等', '动态规划', ['hot100', 'top150']),
  createDefaultStudyProblem(70, '爬楼梯', 'climbing-stairs', '简单', '动态规划', ['hot100', 'top150']),
  createDefaultStudyProblem(94, '二叉树的中序遍历', 'binary-tree-inorder-traversal', '简单', '二叉树', ['hot100', 'top150']),
  createDefaultStudyProblem(146, 'LRU 缓存', 'lru-cache', '中等', '设计', ['hot100', 'top150']),
  createDefaultStudyProblem(200, '岛屿数量', 'number-of-islands', '中等', '图', ['hot100', 'top150']),
  createDefaultStudyProblem(206, '反转链表', 'reverse-linked-list', '简单', '链表', ['hot100', 'top150']),
  createDefaultStudyProblem(215, '数组中的第K个最大元素', 'kth-largest-element-in-an-array', '中等', '堆', ['hot100', 'top150']),
  createDefaultStudyProblem(300, '最长递增子序列', 'longest-increasing-subsequence', '中等', '动态规划', ['hot100']),
  createDefaultStudyProblem(322, '零钱兑换', 'coin-change', '中等', '动态规划', ['hot100']),
  createDefaultStudyProblem(739, '每日温度', 'daily-temperatures', '中等', '单调栈', ['hot100']),
  createDefaultStudyProblem(4, '二维数组中的查找', 'er-wei-shu-zu-zhong-de-cha-zhao-lcof', '中等', '数组', ['offer75']),
  createDefaultStudyProblem(6, '从尾到头打印链表', 'cong-wei-dao-tou-da-yin-lian-biao-lcof', '简单', '链表', ['offer75']),
  createDefaultStudyProblem(10, '斐波那契数列', 'fei-bo-na-qi-shu-lie-lcof', '简单', '动态规划', ['offer75']),
  createDefaultStudyProblem(32, '从上到下打印二叉树', 'cong-shang-dao-xia-da-yin-lian-biao-lcof', '中等', '二叉树', ['offer75']),
  createDefaultStudyProblem(42, '连续子数组的最大和', 'lian-xu-zi-shu-zu-de-zui-da-he-lcof', '简单', '动态规划', ['offer75']),
];

function createDefaultStudyProblem(
  number: number,
  title: string,
  slug: string,
  difficulty: StudyDifficulty,
  category: string,
  listIds: StudyProblemListId[],
): StudyProblem {
  return {
    number,
    title,
    slug,
    difficulty,
    category,
    listIds,
    rounds: [],
    notes: '',
    solutionViewed: false,
    mustRepeat: false,
    timeSpentSeconds: [],
    updatedAt: '',
  };
}
