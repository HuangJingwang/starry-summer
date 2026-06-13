import { AdminShell } from '@/components/AdminShell';
import { AdminStudyManager } from '@/components/AdminStudyManager';

export default function AdminStudyPage() {
  return (
    <AdminShell>
      <section className="admin-panel wide">
        <div className="admin-heading-row">
          <div>
            <p className="eyebrow">学习追踪</p>
            <h1>学习追踪</h1>
            <p>管理 LeetCode 题单、今日任务、复习轮次和题目笔记，并把复盘沉淀成内容草稿。</p>
          </div>
          <span>生成周报草稿</span>
        </div>
        <AdminStudyManager />
      </section>
    </AdminShell>
  );
}
