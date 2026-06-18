import {
  DEFAULT_STUDY_PROBLEMS,
  DEFAULT_STUDY_SETTINGS,
  type StudyProblem,
  type StudyProblemPatch,
  type StudySettings,
  type StudySettingsPatch,
  type StudySubmission,
} from '@starry-summer/shared';

export interface StudySyncState {
  lastSyncedAt: string;
  historyBackfilledAt: string;
  historyBackfilledUsername: string;
  historyBackfilledListId: string;
}

export interface StudyRepository {
  getSettings(): Promise<StudySettings>;
  updateSettings(patch: StudySettingsPatch): Promise<StudySettings>;
  listProblems(): Promise<StudyProblem[]>;
  findProblem(slug: string): Promise<StudyProblem | null>;
  upsertProblem(problem: StudyProblem): Promise<StudyProblem>;
  updateProblem(slug: string, patch: StudyProblemPatch): Promise<StudyProblem | null>;
  listSubmissions(limit?: number): Promise<StudySubmission[]>;
  upsertSubmissions(submissions: StudySubmission[]): Promise<number>;
  getSyncState(): Promise<StudySyncState>;
  updateSyncState(patch: Partial<StudySyncState>): Promise<StudySyncState>;
}

export const STUDY_REPOSITORY = Symbol('STUDY_REPOSITORY');

export class InMemoryStudyRepository implements StudyRepository {
  private settings: StudySettings;
  private syncState: StudySyncState = {
    lastSyncedAt: '',
    historyBackfilledAt: '',
    historyBackfilledUsername: '',
    historyBackfilledListId: '',
  };
  private readonly problems = new Map<string, StudyProblem>();
  private readonly submissions = new Map<string, StudySubmission>();

  constructor(private readonly now: () => Date = () => new Date()) {
    this.settings = {
      ...DEFAULT_STUDY_SETTINGS,
      updatedAt: this.now().toISOString(),
    };

    for (const problem of DEFAULT_STUDY_PROBLEMS) {
      this.problems.set(problem.slug, cloneProblem({ ...problem, updatedAt: this.now().toISOString() }));
    }
  }

  async getSettings(): Promise<StudySettings> {
    return { ...this.settings, reviewIntervals: [...this.settings.reviewIntervals] };
  }

  async updateSettings(patch: StudySettingsPatch): Promise<StudySettings> {
    this.settings = normalizeSettingsPatch(this.settings, patch, this.now());
    return this.getSettings();
  }

  async listProblems(): Promise<StudyProblem[]> {
    return [...this.problems.values()].map(cloneProblem).sort(sortProblems);
  }

  async findProblem(slug: string): Promise<StudyProblem | null> {
    const problem = this.problems.get(slug);
    return problem ? cloneProblem(problem) : null;
  }

  async upsertProblem(problem: StudyProblem): Promise<StudyProblem> {
    const normalized = cloneProblem({
      ...problem,
      updatedAt: problem.updatedAt || this.now().toISOString(),
    });
    this.problems.set(normalized.slug, normalized);
    return cloneProblem(normalized);
  }

  async updateProblem(slug: string, patch: StudyProblemPatch): Promise<StudyProblem | null> {
    const problem = this.problems.get(slug);

    if (!problem) {
      return null;
    }

    const updated = normalizeProblemPatch(problem, patch, this.now());
    this.problems.set(slug, updated);
    return cloneProblem(updated);
  }

  async listSubmissions(limit = 12): Promise<StudySubmission[]> {
    return [...this.submissions.values()]
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .slice(0, limit)
      .map((submission) => ({ ...submission }));
  }

  async upsertSubmissions(submissions: StudySubmission[]): Promise<number> {
    let imported = 0;

    for (const submission of submissions) {
      const key = `${submission.titleSlug}:${submission.submittedAt}`;

      if (!this.submissions.has(key)) {
        imported += 1;
      }

      this.submissions.set(key, { ...submission });
    }

    return imported;
  }

  async getSyncState(): Promise<StudySyncState> {
    return { ...this.syncState };
  }

  async updateSyncState(patch: Partial<StudySyncState>): Promise<StudySyncState> {
    this.syncState = { ...this.syncState, ...patch };
    return this.getSyncState();
  }
}

export function normalizeSettingsPatch(settings: StudySettings, patch: StudySettingsPatch, now: Date): StudySettings {
  return {
    ...settings,
    ...(patch.leetcodeUsername !== undefined ? { leetcodeUsername: patch.leetcodeUsername.trim() } : {}),
    ...(patch.activeListId !== undefined ? { activeListId: patch.activeListId } : {}),
    ...(patch.roundCount !== undefined ? { roundCount: clampInteger(patch.roundCount, 2, 10) } : {}),
    ...(patch.reviewIntervals !== undefined
      ? { reviewIntervals: patch.reviewIntervals.map((value) => clampInteger(value, 1, 365)).slice(0, 9) }
      : {}),
    ...(patch.dailyNew !== undefined ? { dailyNew: clampInteger(patch.dailyNew, 0, 50) } : {}),
    ...(patch.dailyReview !== undefined ? { dailyReview: clampInteger(patch.dailyReview, 0, 100) } : {}),
    ...(patch.deadline !== undefined ? { deadline: patch.deadline.trim().slice(0, 10) } : {}),
    updatedAt: now.toISOString(),
  };
}

export function normalizeProblemPatch(problem: StudyProblem, patch: StudyProblemPatch, now: Date): StudyProblem {
  return cloneProblem({
    ...problem,
    ...(patch.number !== undefined ? { number: clampInteger(patch.number, 0, 10000) } : {}),
    ...(patch.title !== undefined ? { title: patch.title.trim() || problem.title } : {}),
    ...(patch.difficulty !== undefined ? { difficulty: patch.difficulty } : {}),
    ...(patch.category !== undefined ? { category: patch.category.trim() || problem.category } : {}),
    ...(patch.listIds !== undefined ? { listIds: [...new Set(patch.listIds)] } : {}),
    ...(patch.rounds !== undefined ? { rounds: normalizeDateList(patch.rounds).slice(0, 10) } : {}),
    ...(patch.notes !== undefined ? { notes: patch.notes.trim() } : {}),
    ...(patch.solutionViewed !== undefined ? { solutionViewed: patch.solutionViewed } : {}),
    ...(patch.mustRepeat !== undefined ? { mustRepeat: patch.mustRepeat } : {}),
    ...(patch.timeSpentSeconds !== undefined
      ? { timeSpentSeconds: patch.timeSpentSeconds.map((value) => clampInteger(value, 0, 86400)) }
      : {}),
    updatedAt: now.toISOString(),
  });
}

function normalizeDateList(values: string[]): string[] {
  return values
    .map((value) => value.trim().slice(0, 10))
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function cloneProblem(problem: StudyProblem): StudyProblem {
  return {
    ...problem,
    listIds: [...problem.listIds],
    rounds: [...problem.rounds],
    timeSpentSeconds: [...problem.timeSpentSeconds],
  };
}

function sortProblems(a: StudyProblem, b: StudyProblem): number {
  return a.number - b.number || a.title.localeCompare(b.title, 'zh-CN');
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(Number.isFinite(value) ? value : min)));
}
