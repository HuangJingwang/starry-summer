import Link from 'next/link';

import { SiteShell } from '@/components/SiteShell';
import { loadPublicPageMetadata } from '@/lib/page-metadata';

export function generateMetadata() {
  return loadPublicPageMetadata({
    title: '留言',
    description: '留言功能已关闭，访客可以继续浏览文章、日常、项目和归档内容。',
    path: '/guestbook',
  });
}

export default function GuestbookPage() {
  return (
    <SiteShell>
      <main className="page-main guestbook-page guestbook-page--disabled">
        <section className="guestbook-layout" aria-label="留言状态">
          <div className="guestbook-copy-card">
            <div className="page-title">
              <p className="eyebrow">留言</p>
              <h1>留言功能已关闭</h1>
              <p>这里暂时不再接收公开留言。你仍然可以继续阅读文章、浏览日常和项目记录。</p>
            </div>
          </div>
          <aside className="guestbook-panel" aria-label="继续浏览">
            <p className="eyebrow">继续浏览</p>
            <h2>内容入口仍然开放</h2>
                <p>留言入口已经从公共导航移除，但这个地址保留为说明页，避免旧链接直接进入错误页。</p>
            <div className="guestbook-disabled-actions">
              <Link href="/posts">阅读文章</Link>
              <Link href="/archives">查看归档</Link>
              <Link href="/search">搜索内容</Link>
            </div>
          </aside>
        </section>
      </main>
    </SiteShell>
  );
}
