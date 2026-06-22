import type { StudyDashboard } from '@starry-summer/shared';

interface AdminStudySettingsPanelProps {
  dashboard: StudyDashboard;
  studyBusy: boolean;
  actionDisabled: boolean;
  repositoryMode: boolean;
  saveSettings: (formData: FormData) => Promise<void>;
  syncSubmissions: () => Promise<void>;
}

export function AdminStudySettingsPanel({
  actionDisabled,
  dashboard,
  repositoryMode,
  saveSettings,
  studyBusy,
  syncSubmissions,
}: AdminStudySettingsPanelProps) {
  return (
    <section className="admin-study-section">
      <div className="admin-study-section__header">
        <div>
          <h2>复习轮次</h2>
          <p>默认按 R2 +1 天、R3 +3 天、R4 +7 天、R5 +14 天提醒。</p>
        </div>
        <button type="button" onClick={syncSubmissions} disabled={actionDisabled} aria-disabled={actionDisabled}>
          同步最近提交
        </button>
      </div>
      <form className="admin-study-settings" action={saveSettings} aria-busy={studyBusy}>
        <label>
          LeetCode 用户名
          <input name="leetcodeUsername" defaultValue={dashboard.settings.leetcodeUsername} placeholder="username" readOnly={repositoryMode} />
        </label>
        <label>
          当前题单
          <select name="activeListId" defaultValue={dashboard.settings.activeListId} disabled={repositoryMode}>
            <option value="hot100">Hot 100</option>
            <option value="offer75">剑指 Offer 75</option>
            <option value="top150">Top Interview 150</option>
          </select>
        </label>
        <label>
          轮次
          <input name="roundCount" type="number" min={2} max={10} defaultValue={dashboard.settings.roundCount} readOnly={repositoryMode} />
        </label>
        <label>
          间隔
          <input name="reviewIntervals" defaultValue={dashboard.settings.reviewIntervals.join(',')} readOnly={repositoryMode} />
        </label>
        <label>
          每日新题
          <input name="dailyNew" type="number" min={0} defaultValue={dashboard.settings.dailyNew} readOnly={repositoryMode} />
        </label>
        <label>
          每日复习
          <input name="dailyReview" type="number" min={0} defaultValue={dashboard.settings.dailyReview} readOnly={repositoryMode} />
        </label>
        <label>
          截止日期
          <input name="deadline" type="date" defaultValue={dashboard.settings.deadline} readOnly={repositoryMode} />
        </label>
        <button type="submit" disabled={actionDisabled} aria-disabled={actionDisabled}>
          保存设置
        </button>
      </form>
    </section>
  );
}
