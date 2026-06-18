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
  forcedByMustRepeat: boolean;
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

export { STUDY_PROBLEM_LIST_COUNTS, STUDY_PROBLEMS as DEFAULT_STUDY_PROBLEMS } from './study-problems';
