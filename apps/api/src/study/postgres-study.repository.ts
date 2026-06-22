import pg from 'pg';
import {
  DEFAULT_STUDY_SETTINGS,
  type StudyProblem,
  type StudyProblemPatch,
  type StudySettings,
  type StudySettingsPatch,
  type StudySubmission,
} from '@starry-summer/shared';

import {
  normalizeProblemPatch,
  normalizeSettingsPatch,
  type StudySyncState,
  type StudyRepository,
} from './study.repository.js';

const { Pool } = pg;

interface SettingsRow {
  leetcode_username: string;
  active_list_id: StudySettings['activeListId'];
  round_count: number;
  review_intervals: number[];
  daily_new: number;
  daily_review: number;
  deadline: Date | null;
  last_synced_at: Date | null;
  history_backfilled_at: Date | null;
  history_backfilled_username: string;
  history_backfilled_list_id: string;
  updated_at: Date;
}

interface ProblemRow {
  slug: string;
  problem_number: number;
  title: string;
  difficulty: StudyProblem['difficulty'];
  category: string;
  list_ids: StudyProblem['listIds'];
  rounds: unknown;
  notes: string;
  solution_viewed: boolean;
  must_repeat: boolean;
  time_spent_seconds: unknown;
  updated_at: Date;
}

interface SubmissionRow {
  title: string;
  title_slug: string;
  status: string;
  language: string;
  submitted_at: Date;
  problem_url: string;
}

export class PostgresStudyRepository implements StudyRepository {
  private readonly pool: pg.Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl });
  }

  async getSettings(): Promise<StudySettings> {
    await this.ensureSettingsRow();
    const result = await this.pool.query<SettingsRow>(`
      select leetcode_username, active_list_id, round_count, review_intervals, daily_new, daily_review, deadline, updated_at
      from leetcode_study_settings
      where id = true
    `);

    return result.rows[0] ? mapSettingsRow(result.rows[0]) : { ...DEFAULT_STUDY_SETTINGS };
  }

  async updateSettings(patch: StudySettingsPatch): Promise<StudySettings> {
    const current = await this.getSettings();
    const next = normalizeSettingsPatch(current, patch, new Date());

    await this.pool.query(
      `
        insert into leetcode_study_settings (
          id, leetcode_username, active_list_id, round_count, review_intervals, daily_new, daily_review, deadline, updated_at
        )
        values (true, $1, $2, $3, $4, $5, $6, $7, now())
        on conflict (id) do update set
          leetcode_username = excluded.leetcode_username,
          active_list_id = excluded.active_list_id,
          round_count = excluded.round_count,
          review_intervals = excluded.review_intervals,
          daily_new = excluded.daily_new,
          daily_review = excluded.daily_review,
          deadline = excluded.deadline,
          updated_at = now()
      `,
      [
        next.leetcodeUsername,
        next.activeListId,
        next.roundCount,
        next.reviewIntervals,
        next.dailyNew,
        next.dailyReview,
        next.deadline || null,
      ],
    );

    return this.getSettings();
  }

  async listProblems(): Promise<StudyProblem[]> {
    const result = await this.pool.query<ProblemRow>('select * from leetcode_problems order by problem_number, title');
    return result.rows.map(mapProblemRow);
  }

  async findProblem(slug: string): Promise<StudyProblem | null> {
    const result = await this.pool.query<ProblemRow>('select * from leetcode_problems where slug = $1', [slug]);
    return result.rows[0] ? mapProblemRow(result.rows[0]) : null;
  }

  async upsertProblem(problem: StudyProblem): Promise<StudyProblem> {
    await this.pool.query(
      `
        insert into leetcode_problems (
          slug, problem_number, title, difficulty, category, list_ids, rounds, notes,
          solution_viewed, must_repeat, time_spent_seconds, updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11::jsonb, now())
        on conflict (slug) do update set
          problem_number = excluded.problem_number,
          title = excluded.title,
          difficulty = excluded.difficulty,
          category = excluded.category,
          list_ids = excluded.list_ids,
          rounds = excluded.rounds,
          notes = excluded.notes,
          solution_viewed = excluded.solution_viewed,
          must_repeat = excluded.must_repeat,
          time_spent_seconds = excluded.time_spent_seconds,
          updated_at = now()
      `,
      [
        problem.slug,
        problem.number,
        problem.title,
        problem.difficulty,
        problem.category,
        problem.listIds,
        JSON.stringify(problem.rounds),
        problem.notes,
        problem.solutionViewed,
        problem.mustRepeat,
        JSON.stringify(problem.timeSpentSeconds),
      ],
    );

    return (await this.findProblem(problem.slug)) ?? problem;
  }

  async updateProblem(slug: string, patch: StudyProblemPatch): Promise<StudyProblem | null> {
    const current = await this.findProblem(slug);

    if (!current) {
      return null;
    }

    return this.upsertProblem(normalizeProblemPatch(current, patch, new Date()));
  }

  async listSubmissions(limit = 12): Promise<StudySubmission[]> {
    const result = await this.pool.query<SubmissionRow>(
      'select title, title_slug, status, language, submitted_at, problem_url from leetcode_submissions order by submitted_at desc limit $1',
      [limit],
    );

    return result.rows.map(mapSubmissionRow);
  }

  async upsertSubmissions(submissions: StudySubmission[]): Promise<number> {
    let imported = 0;

    for (const submission of submissions) {
      const result = await this.pool.query(
        `
          insert into leetcode_submissions (title, title_slug, status, language, submitted_at, problem_url)
          values ($1, $2, $3, $4, $5, $6)
          on conflict (title_slug, submitted_at) do nothing
        `,
        [
          submission.title,
          submission.titleSlug,
          submission.status,
          submission.language,
          submission.submittedAt,
          submission.problemUrl,
        ],
      );
      imported += result.rowCount ?? 0;
    }

    return imported;
  }

  async getSyncState(): Promise<StudySyncState> {
    await this.ensureSettingsRow();
    const result = await this.pool.query<SettingsRow>(`
      select last_synced_at, history_backfilled_at, history_backfilled_username, history_backfilled_list_id
      from leetcode_study_settings
      where id = true
    `);
    const row = result.rows[0];

    return {
      lastSyncedAt: row?.last_synced_at?.toISOString() ?? '',
      historyBackfilledAt: row?.history_backfilled_at?.toISOString() ?? '',
      historyBackfilledUsername: row?.history_backfilled_username ?? '',
      historyBackfilledListId: row?.history_backfilled_list_id ?? '',
    };
  }

  async updateSyncState(patch: Partial<StudySyncState>): Promise<StudySyncState> {
    await this.ensureSettingsRow();
    const current = await this.getSyncState();
    const next = { ...current, ...patch };

    await this.pool.query(
      `
        update leetcode_study_settings
        set
          last_synced_at = $1,
          history_backfilled_at = $2,
          history_backfilled_username = $3,
          history_backfilled_list_id = $4,
          updated_at = now()
        where id = true
      `,
      [
        next.lastSyncedAt || null,
        next.historyBackfilledAt || null,
        next.historyBackfilledUsername,
        next.historyBackfilledListId,
      ],
    );

    return this.getSyncState();
  }

  private async ensureSettingsRow(): Promise<void> {
    await this.pool.query('insert into leetcode_study_settings (id) values (true) on conflict (id) do nothing');
  }
}

function mapSettingsRow(row: SettingsRow): StudySettings {
  return {
    leetcodeUsername: row.leetcode_username,
    activeListId: row.active_list_id,
    roundCount: row.round_count,
    reviewIntervals: row.review_intervals,
    dailyNew: row.daily_new,
    dailyReview: row.daily_review,
    deadline: row.deadline ? row.deadline.toISOString().slice(0, 10) : '',
    updatedAt: row.updated_at.toISOString(),
  };
}

function mapProblemRow(row: ProblemRow): StudyProblem {
  return {
    number: row.problem_number,
    title: row.title,
    slug: row.slug,
    difficulty: row.difficulty,
    category: row.category,
    listIds: row.list_ids,
    rounds: normalizeStringArray(row.rounds),
    notes: row.notes,
    solutionViewed: row.solution_viewed,
    mustRepeat: row.must_repeat,
    timeSpentSeconds: normalizeNumberArray(row.time_spent_seconds),
    updatedAt: row.updated_at.toISOString(),
  };
}

function mapSubmissionRow(row: SubmissionRow): StudySubmission {
  const submittedAt = row.submitted_at.toISOString();

  return {
    title: row.title,
    titleSlug: row.title_slug,
    status: row.status,
    language: row.language,
    submittedAt,
    submittedAtLabel: submittedAt.slice(0, 10),
    problemUrl: row.problem_url,
  };
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function normalizeNumberArray(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((item): item is number => typeof item === 'number') : [];
}
