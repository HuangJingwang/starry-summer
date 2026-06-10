import { SiteShell } from '@/components/SiteShell';

export default function GuestbookPage() {
  return (
    <SiteShell>
      <main className="page-main narrow">
        <div className="page-title">
          <p className="eyebrow">Guestbook</p>
          <h1>留言板</h1>
          <p>读者留言会先进入审核队列，公开展示只显示已通过内容。</p>
        </div>
        <form className="guestbook-form">
          <input aria-label="Name" placeholder="你的名字" />
          <textarea aria-label="Message" placeholder="留下些什么" rows={5} />
          <button type="button">提交留言</button>
        </form>
      </main>
    </SiteShell>
  );
}
