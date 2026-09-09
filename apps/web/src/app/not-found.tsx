import Link from 'next/link';
import { SiteShell } from '@/components/SiteShell';

export default function NotFound() {
  return <SiteShell><main className="page-main"><div className="page-title"><p className="eyebrow">404 / LOST IN THE ARCHIVE</p><h1>这一页走丢了。</h1><p>内容可能已移动，或这个地址还没有留下记录。</p></div><div className="journal-empty"><Link href="/">回到首页 ↗</Link><p>也可以去 <Link href="/search">搜索内容</Link>，或翻一翻 <Link href="/archives">文章归档</Link>。</p></div></main></SiteShell>;
}
