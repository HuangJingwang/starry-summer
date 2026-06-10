import { SiteShell } from '@/components/SiteShell';

export default function AboutPage() {
  return (
    <SiteShell>
      <main className="page-main narrow">
        <div className="page-title">
          <p className="eyebrow">About</p>
          <h1>关于这个站点</h1>
          <p>
            Starry Summer 是一个个人内容平台，用来记录长期文章、短笔记、日常片段和项目作品。
            它从单人创作后台开始，保留 Markdown 导入导出能力，并面向云服务器长期部署。
          </p>
        </div>
        <section className="about-list">
          <div>
            <h2>Writing</h2>
            <p>长文、教程、观点和阶段性复盘。</p>
          </div>
          <div>
            <h2>Notes</h2>
            <p>读书摘录、技术片段和临时灵感。</p>
          </div>
          <div>
            <h2>Projects</h2>
            <p>开源项目、产品实验和作品集记录。</p>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
