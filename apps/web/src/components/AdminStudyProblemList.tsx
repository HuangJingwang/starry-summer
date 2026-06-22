import type { StudyDashboard, StudyProblem } from '@starry-summer/shared';

interface AdminStudyProblemListProps {
  dashboard: StudyDashboard;
  studyBusy: boolean;
  actionDisabled: boolean;
  repositoryMode: boolean;
  saveProblem: (problem: StudyProblem, formData: FormData) => Promise<void>;
  createProblemDraft: (slug: string) => Promise<void>;
}

export function AdminStudyProblemList({
  actionDisabled,
  createProblemDraft,
  dashboard,
  repositoryMode,
  saveProblem,
  studyBusy,
}: AdminStudyProblemListProps) {
  return (
    <section className="admin-study-section">
      <div className="admin-study-section__header">
        <div>
          <h2>题目笔记</h2>
          <p>轮次用英文逗号分隔日期，例如 2026-06-10,2026-06-12。</p>
        </div>
      </div>
      <div className="admin-study-problem-list">
        {dashboard.problems.map((problem) => (
          <form
            className="admin-study-problem"
            action={(formData) => saveProblem(problem, formData)}
            key={problem.slug}
            aria-busy={studyBusy}
          >
            <div>
              <strong>
                {problem.number}. {problem.title}
              </strong>
              <span>{problem.category} / {problem.difficulty}</span>
            </div>
            <label>
              复习轮次
              <input name="rounds" defaultValue={problem.rounds.join(',')} readOnly={repositoryMode} />
            </label>
            <label>
              个人笔记
              <textarea name="notes" rows={3} defaultValue={problem.notes} readOnly={repositoryMode} />
            </label>
            <div className="admin-study-problem__flags">
              <label>
                <input name="solutionViewed" type="checkbox" defaultChecked={problem.solutionViewed} disabled={repositoryMode} /> 看过题解
              </label>
              <label>
                <input name="mustRepeat" type="checkbox" defaultChecked={problem.mustRepeat} disabled={repositoryMode} /> 重点复刷
              </label>
            </div>
            <div className="admin-study-problem__actions">
              <button type="submit" disabled={actionDisabled} aria-disabled={actionDisabled}>
                保存
              </button>
              <button type="button" onClick={() => createProblemDraft(problem.slug)} disabled={actionDisabled} aria-disabled={actionDisabled}>
                生成复盘草稿
              </button>
            </div>
          </form>
        ))}
      </div>
    </section>
  );
}
