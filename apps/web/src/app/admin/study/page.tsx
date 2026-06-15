import { AdminShell } from '@/components/AdminShell';
import { AdminStudyManager } from '@/components/AdminStudyManager';
import { loadRepositoryStudyDashboard } from '@/lib/study-repository';

export default async function AdminStudyPage() {
  const initialResult = await loadRepositoryStudyDashboard();

  return (
    <AdminShell>
      <section className="admin-panel wide">
        <div className="admin-heading-row">
          <div>
            <p className="eyebrow">学习追踪</p>
            <h1>学习追踪</h1>
            <p>管理 LeetCode 题单、今日任务、复习轮次和题目笔记；仓库模式下先从内容文件读取，后续同步交给 Worker/GitHub 流程。</p>
          </div>
          <span>仓库数据</span>
        </div>
        <AdminStudyManager initialResult={initialResult} repositoryMode />
      </section>
    </AdminShell>
  );
}
