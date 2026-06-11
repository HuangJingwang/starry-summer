import { GuestbookForm } from '@/components/GuestbookForm';
import { SiteShell } from '@/components/SiteShell';
import { loadPublicPageMetadata } from '@/lib/page-metadata';
import { loadApprovedGuestbookEntries } from '@/lib/public-comments';

export function generateMetadata() {
  return loadPublicPageMetadata({
    title: '留言板',
    description: '读者留言和站点交流，会先进入审核队列再公开展示。',
    path: '/guestbook',
  });
}

export default async function GuestbookPage() {
  const entries = await loadApprovedGuestbookEntries();

  return (
    <SiteShell>
      <main className="page-main guestbook-page">
        <div className="guestbook-layout">
          <section className="guestbook-copy-card">
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
          </section>

          <section className="guestbook-panel">
            <p className="eyebrow">Leave a signal</p>
            <h2>写点什么</h2>
            <p>随便留一句话，审核通过后会在这里公开展示。</p>
            <GuestbookForm />
          </section>
        </div>
      </main>
    </SiteShell>
  );
}
