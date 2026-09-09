import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export function JournalFooter() {
  return <footer className="journal-footer">
    <div className="journal-footer__top"><p>保持好奇，继续记录。<span>AN OPEN-ENDED PERSONAL JOURNAL</span></p><Link href="/">回到首页 <ArrowUpRight size={19} /></Link></div>
    <span className="journal-footer__wordmark" aria-hidden="true">STARRY SUMMER<span>✳</span></span>
    <div className="journal-footer__bottom"><span>© ASTER.H / 独立记录，持续更新</span><nav aria-label="页脚导航"><Link href="/archives">归档</Link><Link href="/tags">标签</Link><Link href="/about">关于</Link><a href="/rss.xml">RSS ↗</a></nav></div>
  </footer>;
}
