import { SiteShell } from '@/components/SiteShell';
import { loadPublicSettings } from '@/lib/settings';

export default async function AboutPage() {
  const apiBaseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:4000';
  const settings = await loadPublicSettings(undefined, { apiBaseUrl });

  return (
    <SiteShell>
      <main className="page-main narrow">
        <div className="page-title">
          <p className="eyebrow">About</p>
          <h1>{settings.profile.ownerName}</h1>
          <p>{settings.profile.description}</p>
        </div>
        {settings.profile.socialLinks.length > 0 ? (
          <section className="about-social" aria-label="Social links">
            {settings.profile.socialLinks.map((link) => (
              <a key={`${link.label}-${link.href}`} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
          </section>
        ) : null}
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
