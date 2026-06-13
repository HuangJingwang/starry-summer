'use client';

import { useEffect, useState } from 'react';
import type { StudyDashboard, StudyProblem, StudyReportPeriod } from '@starry-summer/shared';

import {
  buildStudyProblemDraftRequest,
  buildStudyReportDraftRequest,
  buildSyncStudyRequest,
  buildUpdateStudyProblemRequest,
  buildUpdateStudySettingsRequest,
  loadAdminStudyDashboard,
  readStudyErrorMessage,
} from '@/lib/study';

type PanelState = 'idle' | 'loading' | 'submitting' | 'success' | 'error';

export function AdminStudyManager() {
  const [dashboard, setDashboard] = useState<StudyDashboard | null>(null);
  const [state, setState] = useState<PanelState>('loading');
  const [message, setMessage] = useState('');
  const studyBusy = state === 'submitting';

  async function send(request: { url: string; init: RequestInit }, fallback: string) {
    const response = await fetch(request.url, request.init);

    if (!response.ok) {
      throw new Error(await readStudyErrorMessage(response, fallback));
    }

    return response.json().catch(() => null);
  }

  async function load() {
    setState('loading');
    const result = await loadAdminStudyDashboard();
    setDashboard(result.dashboard);
    setState(result.source === 'api' ? 'idle' : 'error');
    setMessage(result.source === 'api' ? '' : '读取学习数据失败，已显示本地占位数据。');
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveSettings(formData: FormData) {
    setState('submitting');
    setMessage('');

    try {
      await send(
        buildUpdateStudySettingsRequest({
          leetcodeUsername: String(formData.get('leetcodeUsername') ?? ''),
          activeListId: String(formData.get('activeListId') ?? 'hot100') as StudyDashboard['settings']['activeListId'],
          roundCount: Number(formData.get('roundCount') ?? 5),
          dailyNew: Number(formData.get('dailyNew') ?? 3),
          dailyReview: Number(formData.get('dailyReview') ?? 5),
          reviewIntervals: String(formData.get('reviewIntervals') ?? '1,3,7,14').split(',').map((item) => Number(item.trim())).filter(Number.isFinite),
          deadline: String(formData.get('deadline') ?? ''),
        }),
        '设置保存失败，请确认已登录且 API 服务可用。',
      );
      await load();
      setState('success');
      setMessage('设置已保存。');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : '设置保存失败，请确认已登录且 API 服务可用。');
    }
  }

  async function syncSubmissions() {
    setState('submitting');
    setMessage('');

    try {
      const result = await send(buildSyncStudyRequest(), '同步失败，请检查 LeetCode 用户名和 API 服务。') as { imported?: number; matchedProblems?: number };
      await load();
      setState('success');
      setMessage(`同步完成：新增 ${result.imported ?? 0} 条提交，匹配 ${result.matchedProblems ?? 0} 道题。`);
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : '同步失败，请检查 LeetCode 用户名和 API 服务。');
    }
  }

  async function saveProblem(problem: StudyProblem, formData: FormData) {
    setState('submitting');
    setMessage('');

    try {
      await send(
        buildUpdateStudyProblemRequest(problem.slug, {
          notes: String(formData.get('notes') ?? ''),
          rounds: String(formData.get('rounds') ?? '').split(',').map((item) => item.trim()).filter(Boolean),
          solutionViewed: formData.get('solutionViewed') === 'on',
          mustRepeat: formData.get('mustRepeat') === 'on',
        }),
        '题目保存失败，请稍后重试。',
      );
      await load();
      setState('success');
      setMessage('题目记录已保存。');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : '题目保存失败，请稍后重试。');
    }
  }

  async function createProblemDraft(slug: string) {
    setState('submitting');
    setMessage('');

    try {
      await send(buildStudyProblemDraftRequest(slug), '创建草稿失败，可能已经存在同名 slug。');
      setState('success');
      setMessage('复盘草稿已创建，可到内容管理继续编辑。');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : '创建草稿失败，可能已经存在同名 slug。');
    }
  }

  async function createReportDraft(period: StudyReportPeriod) {
    setState('submitting');
    setMessage('');

    try {
      await send(buildStudyReportDraftRequest(period), '生成报告草稿失败，可能已经存在同名 slug。');
      setState('success');
      setMessage(period === 'week' ? '生成周报草稿成功。' : '生成月报草稿成功。');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : '生成报告草稿失败，可能已经存在同名 slug。');
    }
  }

  if (!dashboard) {
    return <p className="admin-data-note admin-data-note--neutral">学习数据加载中...</p>;
  }

  return (
    <div className="admin-study-workbench" aria-busy={studyBusy}>
      <p className={`form-message form-message--${state}`} role="status" aria-live="polite">{message || (studyBusy ? '处理中...' : '学习模块已就绪。')}</p>

      <div className="admin-status-grid" aria-label="学习状态概览">
        <StatusCard label="题单进度" value={`${dashboard.summary.startedProblems}/${dashboard.summary.totalProblems}`} />
        <StatusCard label="完成率" value={`${dashboard.summary.completionRate}%`} />
        <StatusCard label="连续打卡" value={`${dashboard.summary.streak} 天`} />
        <StatusCard label="到期复习" value={`${dashboard.reviewDue.length}`} />
      </div>

      <section className="admin-study-section">
        <div className="admin-study-section__header">
          <div>
            <h2>复习轮次</h2>
            <p>默认按 R2 +1 天、R3 +3 天、R4 +7 天、R5 +14 天提醒。</p>
          </div>
          <button type="button" onClick={syncSubmissions} disabled={studyBusy} aria-disabled={studyBusy}>同步最近提交</button>
        </div>
        <form className="admin-study-settings" action={saveSettings} aria-busy={studyBusy}>
          <label>
            LeetCode 用户名
            <input name="leetcodeUsername" defaultValue={dashboard.settings.leetcodeUsername} placeholder="username" />
          </label>
          <label>
            当前题单
            <select name="activeListId" defaultValue={dashboard.settings.activeListId}>
              <option value="hot100">Hot 100</option>
              <option value="offer75">剑指 Offer 75</option>
              <option value="top150">Top Interview 150</option>
            </select>
          </label>
          <label>
            轮次
            <input name="roundCount" type="number" min={2} max={10} defaultValue={dashboard.settings.roundCount} />
          </label>
          <label>
            间隔
            <input name="reviewIntervals" defaultValue={dashboard.settings.reviewIntervals.join(',')} />
          </label>
          <label>
            每日新题
            <input name="dailyNew" type="number" min={0} defaultValue={dashboard.settings.dailyNew} />
          </label>
          <label>
            每日复习
            <input name="dailyReview" type="number" min={0} defaultValue={dashboard.settings.dailyReview} />
          </label>
          <label>
            截止日期
            <input name="deadline" type="date" defaultValue={dashboard.settings.deadline} />
          </label>
          <button type="submit" disabled={studyBusy} aria-disabled={studyBusy}>保存设置</button>
        </form>
      </section>

      <section className="admin-study-section">
        <div className="admin-study-section__header">
          <div>
            <h2>今日任务</h2>
            <p>优先处理到期复习，再补充同分类新题。</p>
          </div>
          <div className="admin-study-actions">
            <button type="button" onClick={() => createReportDraft('week')} disabled={studyBusy} aria-disabled={studyBusy}>生成周报草稿</button>
            <button type="button" onClick={() => createReportDraft('month')} disabled={studyBusy} aria-disabled={studyBusy}>生成月报草稿</button>
          </div>
        </div>
        <div className="admin-study-task-grid">
          {dashboard.reviewDue.map((task) => (
            <article key={task.slug}>
              <span>{task.nextRound} · 逾期 {task.overdueDays} 天</span>
              <strong>{task.title}</strong>
              <small>{task.category} / {task.difficulty}</small>
            </article>
          ))}
          {dashboard.todayFocus.map((task) => (
            <article key={task.slug}>
              <span>新题</span>
              <strong>{task.title}</strong>
              <small>{task.category} / {task.difficulty}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-study-section">
        <div className="admin-study-section__header">
          <div>
            <h2>题目笔记</h2>
            <p>轮次用英文逗号分隔日期，例如 2026-06-10,2026-06-12。</p>
          </div>
        </div>
        <div className="admin-study-problem-list">
          {dashboard.problems.map((problem) => (
            <form className="admin-study-problem" action={(formData) => saveProblem(problem, formData)} key={problem.slug} aria-busy={studyBusy}>
              <div>
                <strong>{problem.number}. {problem.title}</strong>
                <span>{problem.category} / {problem.difficulty}</span>
              </div>
              <label>
                复习轮次
                <input name="rounds" defaultValue={problem.rounds.join(',')} />
              </label>
              <label>
                个人笔记
                <textarea name="notes" rows={3} defaultValue={problem.notes} />
              </label>
              <div className="admin-study-problem__flags">
                <label><input name="solutionViewed" type="checkbox" defaultChecked={problem.solutionViewed} /> 看过题解</label>
                <label><input name="mustRepeat" type="checkbox" defaultChecked={problem.mustRepeat} /> 重点复刷</label>
              </div>
              <div className="admin-study-problem__actions">
                <button type="submit" disabled={studyBusy} aria-disabled={studyBusy}>保存</button>
                <button type="button" onClick={() => createProblemDraft(problem.slug)} disabled={studyBusy} aria-disabled={studyBusy}>生成复盘草稿</button>
              </div>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
