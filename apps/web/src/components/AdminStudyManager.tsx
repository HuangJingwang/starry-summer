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
  type StudyLoadResult,
} from '@/lib/study';

import { AdminStudyProblemList } from './AdminStudyProblemList';
import { AdminStudySettingsPanel } from './AdminStudySettingsPanel';
import { AdminStudyTaskPanel } from './AdminStudyTaskPanel';

type PanelState = 'idle' | 'loading' | 'submitting' | 'success' | 'error';

interface AdminStudyManagerProps {
  initialResult?: StudyLoadResult;
  repositoryMode?: boolean;
}

const repositoryModeMessage = '仓库模式下学习数据从 content/leetcode/dashboard.json 读取，写入和同步将改由 Worker/GitHub 流程处理。';
const repositoryActionMessage = '仓库模式下不会调用旧数据库学习接口，请通过后续 Worker 同步或直接提交仓库数据文件。';

export function AdminStudyManager({ initialResult, repositoryMode = false }: AdminStudyManagerProps) {
  const [dashboard, setDashboard] = useState<StudyDashboard | null>(initialResult?.dashboard ?? null);
  const [state, setState] = useState<PanelState>(initialResult ? 'idle' : 'loading');
  const [message, setMessage] = useState(initialResult?.source === 'repository-file' ? repositoryModeMessage : '');
  const studyBusy = state === 'submitting';
  const actionDisabled = studyBusy || repositoryMode;

  async function send(request: { url: string; init: RequestInit }, fallback: string) {
    if (repositoryMode) {
      throw new Error(repositoryActionMessage);
    }

    const response = await fetch(request.url, request.init);

    if (!response.ok) {
      throw new Error(await readStudyErrorMessage(response, fallback));
    }

    return response.json().catch(() => null);
  }

  async function load() {
    if (initialResult) {
      setDashboard(initialResult.dashboard);
      setState('idle');
      setMessage(initialResult.source === 'repository-file' ? repositoryModeMessage : '');
      return;
    }

    setState('loading');
    const result = await loadAdminStudyDashboard();
    setDashboard(result.dashboard);
    setState(result.source === 'api' ? 'idle' : 'error');
    setMessage(result.source === 'api' ? '' : '读取学习数据失败，已显示本地占位数据。');
  }

  useEffect(() => {
    void load();
  }, []);

  function blockRepositoryAction() {
    setState('error');
    setMessage(repositoryActionMessage);
  }

  async function saveSettings(formData: FormData) {
    if (repositoryMode) {
      blockRepositoryAction();
      return;
    }

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
    if (repositoryMode) {
      blockRepositoryAction();
      return;
    }

    setState('submitting');
    setMessage('');

    try {
      const result = await send(buildSyncStudyRequest(), '同步失败，请检查 LeetCode 用户名和 API 服务。') as {
        imported?: number;
        matchedProblems?: number;
        addedRounds?: number;
        historyBackfilled?: number;
        skipped?: number;
      };
      await load();
      setState('success');
      setMessage(`同步完成：新增 ${result.imported ?? 0} 条提交，推进 ${result.addedRounds ?? result.matchedProblems ?? 0} 轮，历史回填 ${result.historyBackfilled ?? 0} 题，跳过 ${result.skipped ?? 0} 条。`);
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : '同步失败，请检查 LeetCode 用户名和 API 服务。');
    }
  }

  async function saveProblem(problem: StudyProblem, formData: FormData) {
    if (repositoryMode) {
      blockRepositoryAction();
      return;
    }

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
    if (repositoryMode) {
      blockRepositoryAction();
      return;
    }

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
    if (repositoryMode) {
      blockRepositoryAction();
      return;
    }

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
      <p className={`form-message form-message--${state}`} role="status" aria-live="polite">
        {message || (studyBusy ? '处理中...' : '学习模块已就绪。')}
      </p>

      <div className="admin-status-grid" aria-label="学习状态概览">
        <StatusCard label="题单进度" value={`${dashboard.summary.startedProblems}/${dashboard.summary.totalProblems}`} />
        <StatusCard label="完成率" value={`${dashboard.summary.completionRate}%`} />
        <StatusCard label="连续打卡" value={`${dashboard.summary.streak} 天`} />
        <StatusCard label="到期复习" value={`${dashboard.reviewDue.length}`} />
      </div>

      <AdminStudySettingsPanel
        dashboard={dashboard}
        studyBusy={studyBusy}
        actionDisabled={actionDisabled}
        repositoryMode={repositoryMode}
        saveSettings={saveSettings}
        syncSubmissions={syncSubmissions}
      />

      <AdminStudyTaskPanel
        dashboard={dashboard}
        actionDisabled={actionDisabled}
        createReportDraft={createReportDraft}
      />

      <AdminStudyProblemList
        dashboard={dashboard}
        studyBusy={studyBusy}
        actionDisabled={actionDisabled}
        repositoryMode={repositoryMode}
        saveProblem={saveProblem}
        createProblemDraft={createProblemDraft}
      />
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
