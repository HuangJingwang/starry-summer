import { GuestbookForm } from '@/components/GuestbookForm';
import { SiteShell } from '@/components/SiteShell';
import { loadApprovedGuestbookEntries } from '@/lib/public-comments';

export default async function GuestbookPage() {
  const entries = await loadApprovedGuestbookEntries();

  return (
    <SiteShell>
      <main className="page-main narrow">
        <div className="page-title">
          <p className="eyebrow">Guestbook</p>
          <h1>留言板</h1>
          <p>读者留言会先进入审核队列，公开展示只显示已通过内容。</p>
        </div>
        {entries.length > 0 ? (
          <ol className="guestbook-list">
            {entries.map((entry) => (
              <li key={entry.id}>
                <div>
                  <strong>{entry.authorName || '匿名读者'}</strong>
                  {entry.createdAt ? <time dateTime={entry.createdAt}>{entry.createdAt.slice(0, 10)}</time> : null}
                </div>
                <p>{entry.body}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="empty-state">暂无公开留言。</p>
        )}
        <GuestbookForm />
      </main>
    </SiteShell>
  );
}
