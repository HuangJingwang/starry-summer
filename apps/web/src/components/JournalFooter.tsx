import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export function JournalFooter() {
  return <footer className="journal-footer">
    <div className="journal-footer__top"><p>Starry Summer<span>Aster.H 的文章、项目与日常记录。</span></p><Link href="/about">认识一下 <ArrowUpRight size={19} /></Link></div>
    <nav className="editorial-footer-browse" aria-label="浏览内容"><Link href="/posts">文章</Link><Link href="/projects">个人项目</Link><Link href="/moments">推荐分享</Link><Link href="/archives">归档</Link><Link href="/categories">分类</Link><Link href="/tags">标签</Link><Link href="/series">专题</Link><Link href="/notes">笔记</Link><Link href="/leetcode">刷题日记</Link><Link href="/search">搜索</Link></nav>
    <div className="journal-footer__bottom"><span>© Aster.H</span><nav aria-label="页脚导航"><a href="https://github.com/Aster-H" target="_blank" rel="noopener noreferrer">GitHub</a><Link href="/about">关于</Link><a href="/rss.xml">RSS ↗</a></nav></div>
  </footer>;
}
