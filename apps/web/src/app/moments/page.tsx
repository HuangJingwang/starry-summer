import { RecommendedShareGrid } from '@/components/RecommendedShareGrid';
import { SiteShell } from '@/components/SiteShell';
import { loadPublicPageMetadata } from '@/lib/page-metadata';
import { recommendedShares } from '@/lib/recommended-shares';

export function generateMetadata() {
  return loadPublicPageMetadata({
    title: '推荐分享',
    description: '收藏常用工具、灵感网站、组件库和学习资源。',
    path: '/moments',
  });
}

export default function MomentsPage() {
  return (
    <SiteShell>
      <main className="page-main share-page">
        <div className="share-page__heading">
          <p className="eyebrow">Recommended Shares</p>
          <h1>推荐分享</h1>
          <p>收藏一些真的会反复打开的工具、灵感网站、组件库和学习资料。</p>
        </div>
        <RecommendedShareGrid resources={recommendedShares} />
      </main>
    </SiteShell>
  );
}
