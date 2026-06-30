import type { StudyDashboard, StudyProblem, StudyReviewTask, StudyTask } from '@starry-summer/shared';

export interface HomeLeetCodeRecommendation {
  kind: 'new' | 'review';
  label: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  href: string;
}

export function buildHomeLeetCodeRecommendation(dashboard: StudyDashboard): HomeLeetCodeRecommendation | null {
  const focusTask = dashboard.todayFocus.at(0);

  if (focusTask) {
    return buildNewRecommendation(focusTask);
  }

  const reviewTask = dashboard.reviewDue.at(0);

  if (reviewTask) {
    return buildReviewRecommendation(reviewTask);
  }

  const activeProblem = dashboard.problems.find(
    (problem) => problem.rounds.length === 0 && problem.listIds.includes(dashboard.settings.activeListId),
  );

  if (activeProblem) {
    return buildNewRecommendation(activeProblem);
  }

  const repeatProblem = dashboard.problems.find((problem) => problem.mustRepeat);

  if (repeatProblem) {
    return {
      ...buildBaseRecommendation(repeatProblem, 'review', '重点复刷'),
      description: '标记为重点复刷，重做时先回忆核心思路，再检查上次卡住的边界条件。',
    };
  }

  return null;
}

function buildNewRecommendation(task: StudyTask): HomeLeetCodeRecommendation {
  return {
    ...buildBaseRecommendation(task, 'new', '未刷新题'),
    description: `还没有刷过，先用 ${task.category} 思路独立建档；完成后记录第一轮关键边界。`,
  };
}

function buildReviewRecommendation(task: StudyReviewTask): HomeLeetCodeRecommendation {
  const schedule = task.forcedByMustRepeat ? '重点复刷' : `逾期 ${task.overdueDays} 天`;

  return {
    ...buildBaseRecommendation(task, 'review', '到期复习'),
    description: `${task.dueDate} 到期的 ${task.nextRound} 复习题，${schedule}；先回忆核心状态，再补充错点。`,
  };
}

function buildBaseRecommendation(
  task: StudyTask | StudyProblem,
  kind: HomeLeetCodeRecommendation['kind'],
  label: string,
): HomeLeetCodeRecommendation {
  return {
    kind,
    label,
    title: task.title,
    description: '',
    difficulty: ['简单', '中等', '困难'].includes(task.difficulty) ? task.difficulty : '未标注',
    category: task.category,
    href: `https://leetcode.cn/problems/${task.slug}/`,
  };
}
