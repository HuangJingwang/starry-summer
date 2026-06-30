import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

const styleImportOrder = [
  'src/app/styles/base.css',
  'src/app/styles/public.css',
  'src/app/styles/home.css',
  'src/app/styles/content.css',
  'src/app/styles/leetcode.css',
  'src/app/styles/share.css',
  'src/app/styles/admin.css',
  'src/app/styles/responsive.css',
];

function readStylesheet(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function readGlobalStyles() {
  return styleImportOrder.map(readStylesheet).join('\n');
}

function readStyleBlock(css: string, selector: string) {
  return (
    [...css.matchAll(new RegExp(`^${selector.replaceAll('.', '\\.')}\\s*{(?<body>[\\s\\S]*?)\\n}`, 'gm'))].at(-1)
      ?.groups?.body ?? ''
  );
}

function readCssDeclaration(block: string, property: string) {
  return block.match(new RegExp(`${property}:\\s*(?<value>[^;]+);`))?.groups?.value?.trim() ?? '';
}

function readMediaRule(source: string, mediaQuery: string, selector: string) {
  const mediaStart = source.indexOf(`@media ${mediaQuery} {`);

  if (mediaStart === -1) {
    return '';
  }

  let depth = 0;
  let mediaEnd = source.length;
  let started = false;

  for (let index = mediaStart; index < source.length; index += 1) {
    const char = source[index];

    if (char === '{') {
      depth += 1;
      started = true;
    }

    if (char === '}') {
      depth -= 1;
    }

    if (started && depth === 0) {
      mediaEnd = index + 1;
      break;
    }
  }

  const mediaBlock = source.slice(mediaStart, mediaEnd).replace(/^[ \t]+/gm, '');

  return readStyleBlock(mediaBlock, selector);
}

function parsePxTrackList(value: string) {
  return [...value.matchAll(/(-?\d+(?:\.\d+)?)px/g)].map((match) => Number(match[1]));
}

describe('global styles', () => {
  test('keeps global CSS split by base, public, page-family, admin, and responsive concerns', () => {
    const rootLayout = readFileSync(join(process.cwd(), 'src/app/layout.tsx'), 'utf8');
    const baseCss = readStylesheet('src/app/styles/base.css');
    const publicCss = readStylesheet('src/app/styles/public.css');
    const homeCss = readStylesheet('src/app/styles/home.css');
    const contentCss = readStylesheet('src/app/styles/content.css');
    const leetcodeCss = readStylesheet('src/app/styles/leetcode.css');
    const shareCss = readStylesheet('src/app/styles/share.css');
    const adminCss = readStylesheet('src/app/styles/admin.css');
    const responsiveCss = readStylesheet('src/app/styles/responsive.css');

    expect(baseCss.charCodeAt(0)).not.toBe(0xfeff);
    expect(rootLayout).toContain("import './styles/base.css';");
    expect(rootLayout).toContain("import './styles/public.css';");
    expect(rootLayout).toContain("import './styles/home.css';");
    expect(rootLayout).toContain("import './styles/content.css';");
    expect(rootLayout).toContain("import './styles/leetcode.css';");
    expect(rootLayout).toContain("import './styles/share.css';");
    expect(rootLayout).toContain("import './styles/admin.css';");
    expect(rootLayout).toContain("import './styles/responsive.css';");
    expect(rootLayout).not.toContain("import './styles.css';");
    expect(baseCss).not.toContain('.admin-layout {');
    expect(baseCss).not.toContain('.site-header {');
    expect(baseCss).not.toContain('.portfolio-home');
    expect(baseCss).not.toContain('.page-main');
    expect(baseCss).not.toContain('.study-archive-page');
    expect(baseCss).not.toContain('.share-page');
    expect(publicCss).toContain('.site-header {');
    expect(publicCss).toContain('.theme-toggle {');
    expect(homeCss).toContain('.portfolio-home');
    expect(homeCss).toContain('.cyber-home');
    expect(contentCss).toContain('.page-main');
    expect(contentCss).toContain('.guestbook-page');
    expect(leetcodeCss).toContain('.study-archive-page');
    expect(leetcodeCss).toContain('.study-metric-grid');
    expect(shareCss).toContain('.share-page');
    expect(baseCss).not.toContain('@media (max-width: 820px)');
    expect(adminCss).toContain('.admin-layout {');
    expect(adminCss).toContain('.admin-primary-nav a[aria-current="page"]');
    expect(responsiveCss).toContain('@media (max-width: 820px)');
    expect(responsiveCss).toContain('.admin-layout,');
  });

  test('loads Averia only for public display typography', () => {
    const rootLayout = readFileSync(join(process.cwd(), 'src/app/layout.tsx'), 'utf8');
    const css = readGlobalStyles();

    expect(rootLayout).toContain('family=Averia+Gruesa+Libre&display=swap');
    expect(rootLayout).not.toContain('family=Noto+Serif+SC');
    expect(css).toContain('--font-display: "Averia Gruesa Libre", Arial, Helvetica, sans-serif;');
    expect(css).toContain('--font-nav: "PingFang SC", -apple-system, system-ui');
    expect(css).toContain('.brand span:last-child');
    expect(css).toContain('.portfolio-hero__name');
    expect(css).toContain('.portfolio-hero__role');
    expect(css).toContain('font-family: var(--font-display);');
    expect(readStylesheet('src/app/styles/admin.css')).not.toContain('Averia Gruesa Libre');
  });

  test('defines a system dark mode palette for public and admin surfaces', () => {
    const css = readGlobalStyles();
    const darkModeBlock = css.match(/@media\s*\(prefers-color-scheme:\s*dark\)\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';

    expect(darkModeBlock).toContain(':root');
    expect(darkModeBlock).toContain('--bg:');
    expect(darkModeBlock).toContain('--panel:');
    expect(darkModeBlock).toContain('--ink:');
    expect(darkModeBlock).toContain('--muted:');
    expect(darkModeBlock).toContain('--line:');
  });

  test('keeps admin form fields on the theme panel background', () => {
    const css = readGlobalStyles();
    const adminFieldBlock = css.match(/\.admin-filter input,[\s\S]*?\.admin-transfer textarea\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';

    expect(adminFieldBlock).toContain('background: var(--panel);');
    expect(adminFieldBlock).not.toContain('background: #fff;');
  });

  test('keeps admin pages in a cyber workbench visual system', () => {
    const css = readGlobalStyles();
    const adminLayoutBlock = css.match(/\.admin-layout\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';

    expect(adminLayoutBlock).toContain('var(--cyber-bg)');
    expect(css).toContain('.admin-layout::before');
    expect(css).toContain('.admin-command-bar');
    expect(css).toContain('.admin-command-bar__actions .theme-toggle');
    expect(css).toContain('.admin-primary-nav a[aria-current="page"]');
    expect(css).toContain('.admin-workbench-grid');
    expect(css).toContain('.admin-workbench-card');
    expect(css).toContain('.admin-quick-create');
    expect(css).toContain('.admin-filter-bar');
    expect(css).toContain('.admin-type-segments');
    expect(css).toContain('.admin-status-chips');
    expect(css).toContain('.settings-maintenance-grid');
    expect(css).toContain('.admin-ops-grid');
    expect(css).toContain('.admin-ops-card');
    expect(css).toContain('.admin-panel');
    expect(css).toContain('background: rgba(4, 6, 14, 0.62);');
    expect(css).not.toContain('.admin-grid span {\n  background: #fff;');
  });

  test('styles the asset uploader without exposing the native file input chrome', () => {
    const css = readGlobalStyles();

    expect(css).toContain('.asset-upload-grid');
    expect(css).toContain('.asset-file-picker');
    expect(css).toContain('.asset-file-picker input[type="file"]');
    expect(css).toContain('opacity: 0;');
    expect(css).toContain('.asset-upload-actions');
    expect(css).toContain('.asset-thumb');
    expect(css).toContain('.asset-item__actions');
  });

  test('styles the admin cover picker as a compact form control', () => {
    const css = readGlobalStyles();

    expect(css).toContain('.cover-picker');
    expect(css).toContain('grid-template-columns: minmax(240px, 1fr) auto;');
    expect(css).toContain('.cover-picker button');
  });

  test('defines the cyber archive visual system used by the home page', () => {
    const css = readGlobalStyles();

    expect(css).toContain('--cyber-bg: #04060e;');
    expect(css).toContain('.cyber-home');
    expect(css).toContain('.cyber-firefly');
    expect(css).toContain('@keyframes cyber-firefly-drift');
    expect(css).toContain('.author-bio-card');
    expect(css).toContain('.content-filter-rail');
    expect(css).toContain('.cyber-home .content-card');
  });

  test('keeps public list sort tabs with crisp independent borders', () => {
    const css = readGlobalStyles();
    const tabsBlock = readStyleBlock(css, '.page-main .sort-tabs');
    const tabBlock = readStyleBlock(css, '.page-main .sort-tabs a');
    const activeTabBlock =
      css.match(/\.page-main \.sort-tabs a\[aria-current='page'\]\s*{(?<body>[\s\S]*?)\n}/)?.groups
        ?.body ?? '';
    const dayActiveTabBlock =
      css.match(/:root\[data-theme='summer-day'\] \.page-main \.sort-tabs a\[aria-current='page'\]\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';

    expect(tabsBlock).toContain('border: 0;');
    expect(tabsBlock).toContain('gap: 10px;');
    expect(tabsBlock).toContain('overflow: visible;');
    expect(tabBlock).toContain('background: rgba(4, 8, 18, 0.46);');
    expect(activeTabBlock).toContain('border-color: rgba(125, 211, 252, 0.82);');
    expect(activeTabBlock).toContain('box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.24);');
    expect(activeTabBlock).not.toContain('border-color: transparent;');
    expect(dayActiveTabBlock).toContain('border-color: rgba(8, 116, 127, 0.28);');
  });

  test('keeps the about page container visibly rounded when it carries a panel background', () => {
    const aboutPageSource = readFileSync(join(process.cwd(), 'src/app/about/page.tsx'), 'utf8');
    const css = readGlobalStyles();
    const aboutPageBlock = readStyleBlock(css, '.about-page');

    expect(aboutPageSource).toContain('page-main narrow about-page');
    expect(aboutPageBlock).toContain('border-radius:');
    expect(aboutPageBlock).toContain('overflow: hidden;');
  });

  test('keeps the public about page concise and site-focused', () => {
    const aboutPageSource = readFileSync(join(process.cwd(), 'src/app/about/page.tsx'), 'utf8');

    expect(aboutPageSource).toContain('关于本站');
    expect(aboutPageSource).toContain('个人内容平台');
    expect(aboutPageSource).toContain('仓库');
    expect(aboutPageSource).toContain('技术栈');
    expect(aboutPageSource).toContain('className="about-note"');
    expect(aboutPageSource).toContain('className="about-note__list"');
    expect(aboutPageSource).toContain('className="about-note__item"');
    expect(aboutPageSource).toContain('className="about-note__item-icon"');
    expect(aboutPageSource).toContain('className="about-stack"');
    expect(aboutPageSource).toContain('className="about-stack__icon"');
    expect(aboutPageSource).toContain('aria-hidden="true"');
    expect(aboutPageSource).toContain("from 'lucide-react'");
    expect(aboutPageSource).not.toContain('className="about-site-grid"');
    expect(aboutPageSource).not.toContain('className="about-site-card"');
    expect(aboutPageSource).not.toContain('className="about-flow"');
    expect(aboutPageSource).not.toContain('内容结构');
    expect(aboutPageSource).not.toContain('运行方式');
    expect(aboutPageSource).not.toContain('阅读路径');
    expect(aboutPageSource).not.toContain('不是');
    expect(aboutPageSource).not.toContain('而是');
    expect(aboutPageSource).not.toContain('AI 产品');
    expect(aboutPageSource).not.toContain('招聘');
  });

  test('aligns the concise about note with the public theme material', () => {
    const css = readGlobalStyles();
    const aboutPageBlock = readStyleBlock(css, '.about-page');
    const aboutNoteBlock = readStyleBlock(css, '.about-note');
    const dayAboutCardBlock =
      css.match(/:root\[data-theme='summer-day'\] \.about-note\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';

    expect(aboutPageBlock).toContain('linear-gradient(135deg, rgba(34, 211, 238, 0.11), transparent 36%)');
    expect(aboutPageBlock).toContain('linear-gradient(180deg, rgba(15, 23, 42, 0.6), rgba(2, 6, 23, 0.42))');
    expect(aboutNoteBlock).toContain('background: rgba(15, 23, 42, 0.42);');
    expect(aboutNoteBlock).toContain('border: 1px solid rgba(148, 163, 184, 0.16);');
    expect(dayAboutCardBlock).toContain('background: var(--summer-panel-sheen), var(--summer-panel);');
    expect(dayAboutCardBlock).toContain('border-color: var(--summer-line);');
  });

  test('styles the posts archive as a YYsuni-inspired dark grouped timeline', () => {
    const css = readGlobalStyles();
    const archiveBlock = readStyleBlock(css, '.posts-archive');
    const groupBlock = readStyleBlock(css, '.posts-archive-group');
    const headingBlock = readStyleBlock(css, '.posts-archive-group__heading');
    const itemBlock = readStyleBlock(css, '.posts-archive-item');
    const dotBlock = readStyleBlock(css, '.posts-archive-item__dot');
    const titleHoverBlock = readStyleBlock(css, '.posts-archive-item:hover .posts-archive-item__title');
    const coverPreviewBlock = readStyleBlock(css, '.posts-archive-item__cover-preview');
    const coverPreviewHoverBlock = readStyleBlock(css, '.posts-archive-item:hover .posts-archive-item__cover-preview');
    const groupHoverBlock = readStyleBlock(css, '.posts-archive-group:hover');
    const groupFocusWithinBlock = readStyleBlock(css, '.posts-archive-group:focus-within');
    const dayGroupBlock =
      css.match(/:root\[data-theme='summer-day'\] \.posts-archive-group\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ??
      '';
    const dayItemHoverBlock =
      css.match(/:root\[data-theme='summer-day'\] \.posts-archive-item:hover\s*{(?<body>[\s\S]*?)\n}/)?.groups
        ?.body ?? '';

    expect(archiveBlock).toContain('max-width: 840px;');
    expect(archiveBlock).toContain('gap: 24px;');
    expect(groupBlock).toContain('background: rgba(4, 6, 14, 0.54);');
    expect(groupBlock).toContain('backdrop-filter: blur(18px) saturate(1.08);');
    expect(groupBlock).toContain('border: 1px solid rgba(148, 163, 184, 0.18);');
    expect(groupBlock).toContain('position: relative;');
    expect(groupBlock).toContain('z-index: 0;');
    expect(groupBlock).not.toContain('background: #fff;');
    expect(groupHoverBlock).toContain('z-index: 2;');
    expect(groupFocusWithinBlock).toContain('z-index: 2;');
    expect(headingBlock).toContain('justify-content: space-between;');
    expect(itemBlock).toContain('grid-template-columns: 52px 18px minmax(0, 1fr) auto auto;');
    expect(itemBlock).toContain('color: rgba(226, 232, 240, 0.86);');
    expect(itemBlock).not.toContain('background: #fff;');
    expect(dotBlock).toContain('background: rgba(148, 163, 184, 0.64);');
    expect(dotBlock).toContain('height: 5px;');
    expect(titleHoverBlock).toContain('color: var(--cyber-cyan);');
    expect(titleHoverBlock).toContain('transform: translateX(8px);');
    expect(coverPreviewBlock).toContain('height: 128px;');
    expect(coverPreviewBlock).toContain('opacity: 0;');
    expect(coverPreviewBlock).toContain('pointer-events: none;');
    expect(coverPreviewHoverBlock).toContain('opacity: 1;');
    expect(coverPreviewHoverBlock).toContain('transform: translate3d(0, 0, 0) scale(1);');
    expect(dayGroupBlock).toContain('background: var(--summer-panel-sheen), var(--summer-panel);');
    expect(dayGroupBlock).toContain('color: var(--summer-ink);');
    expect(dayItemHoverBlock).toContain('background: rgba(255, 213, 105, 0.16);');
  });

  test('uses the shared quiet canvas meteor layer on public pages instead of the page beam sweep', () => {
    const css = readGlobalStyles();
    const leetcodeBeamBlock = css.match(/\.study-archive-page::after\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const siteCanvasBlock = css.match(/\.site-shell__canvas\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const persistentBackgroundBlock = css.match(/\.persistent-public-background\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const activeBackgroundBlock =
      css.match(/\.persistent-public-background\[data-active='true'\] \.site-shell__canvas\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const rootLayoutSource = readStylesheet('src/app/layout.tsx');
    const siteShellSource = readStylesheet('src/components/SiteShell.tsx');
    const leetcodeSource = readStylesheet('src/app/leetcode/page.tsx');

    expect(rootLayoutSource).toContain("import { PersistentPublicBackground } from '@/components/PersistentPublicBackground';");
    expect(rootLayoutSource).toContain('<PersistentPublicBackground />');
    expect(siteShellSource).not.toContain("import { StarrySkyCanvas } from '@/components/StarrySkyCanvas';");
    expect(siteShellSource).not.toContain('<StarrySkyCanvas className="site-shell__canvas" showFleet={false} />');
    expect(leetcodeSource).not.toContain('page-main__canvas');
    expect(persistentBackgroundBlock).toContain('position: fixed;');
    expect(persistentBackgroundBlock).toContain('pointer-events: none;');
    expect(siteCanvasBlock).toContain('position: fixed;');
    expect(siteCanvasBlock).toContain('opacity: 0;');
    expect(siteCanvasBlock).toContain('pointer-events: none;');
    expect(activeBackgroundBlock).toContain('opacity: 0.84;');
    expect(leetcodeBeamBlock).toContain('animation: none;');
    expect(leetcodeBeamBlock).toContain('background: transparent;');
    expect(leetcodeBeamBlock).toContain('filter: none;');
  });

  test('keeps the LeetCode archive in the home glass dashboard style across day and night themes', () => {
    const css = readGlobalStyles();
    const studyPageBlock = readStyleBlock(css, '.study-archive-page');
    const metricCardBlock = readStyleBlock(css, '.study-metric-card');
    const metricNumberBlock = readStyleBlock(css, '.study-metric-card strong');
    const taskCardBlock = readStyleBlock(css, '.study-task-card');
    const contentSectionBlock = readStyleBlock(css, '.study-archive-page .content-section');
    const heatmapBlock = readStyleBlock(css, '.study-heatmap');
    const heatmapLevelFourBlock =
      css.match(/\.study-heatmap span\[data-level="4"\]\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const noteGridBlock = readStyleBlock(css, '.study-note-grid');

    expect(css).toContain('.study-metric-grid');
    expect(css).toContain('.study-task-grid');
    expect(css).toContain('.study-note-grid');
    expect(css).toContain('.study-difficulty');
    expect(css).toContain(':root[data-theme=\'summer-day\'] .study-archive-page .section-heading h2');
    expect(studyPageBlock).toContain('--study-accent: var(--cyber-cyan);');
    expect(studyPageBlock).toContain('--study-glass-blur: blur(18px) saturate(1.08);');
    expect(studyPageBlock).toContain('linear-gradient(135deg, rgba(34, 211, 238, 0.07), transparent 48%)');
    expect(studyPageBlock).toContain('rgba(4, 6, 14, 0.54)');
    expect(studyPageBlock).toContain('inset 0 0 0 1px rgba(255, 255, 255, 0.22)');
    expect(studyPageBlock).toContain('background: var(--public-home-background);');
    expect(studyPageBlock).toContain('--study-panel:');
    expect(metricCardBlock).toContain('background: var(--study-panel-strong);');
    expect(metricCardBlock).toContain('box-shadow: var(--study-shadow);');
    expect(metricCardBlock).not.toContain('background: #fff;');
    expect(metricNumberBlock).toContain('font-variant-numeric: tabular-nums;');
    expect(metricNumberBlock).toContain('font-size: clamp(2.35rem, 5vw, 4.25rem);');
    expect(taskCardBlock).toContain('background: rgba(4, 6, 14, 0.28);');
    expect(taskCardBlock).not.toContain('background: #fff;');
    expect(contentSectionBlock).toContain('background: var(--study-panel);');
    expect(contentSectionBlock).toContain('border: 1px solid var(--study-line);');
    expect(contentSectionBlock).toContain('box-shadow: var(--study-shadow);');
    expect(contentSectionBlock).not.toContain('background: #fff;');
    expect(heatmapBlock).toContain('grid-auto-flow: column;');
    expect(heatmapBlock).toContain('grid-template-rows: repeat(7, 18px);');
    expect(heatmapLevelFourBlock).toContain('rgba(var(--study-accent-rgb), 0.84)');
    expect(noteGridBlock).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
    expect(readStylesheet('src/app/styles/responsive.css')).toContain('.study-note-grid,');
    expect(heatmapLevelFourBlock).not.toContain('rgba(251, 191, 36, 0.56)');
  });

  test('lets the LeetCode study module switch between refined light and dark themes', () => {
    const css = readGlobalStyles();
    const nightBodyBlock =
      css.match(/:root\[data-theme='summer-night'\] body:has\(\.study-archive-page\),\r?\nbody:has\(\.study-archive-page\)\s*{(?<body>[\s\S]*?)\n}/)?.groups
        ?.body ?? '';
    const dayPageBlock =
      css.match(/:root\[data-theme='summer-day'\] \.study-archive-page\s*{(?<body>[\s\S]*?)\n}/)?.groups
        ?.body ?? '';
    const dayBodyBlock =
      css.match(/:root\[data-theme='summer-day'\] body:has\(\.study-archive-page\)\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const dayCardBlock =
      css.match(/:root\[data-theme='summer-day'\] \.study-metric-card,[\s\S]*?\.leetcode-item\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const dayContentCardBlock =
      css.match(/:root\[data-theme='summer-day'\] \.study-archive-page \.content-card\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';

    expect(css).toContain(":root[data-theme='summer-night'] .study-archive-page");
    expect(css).toContain(":root[data-theme='summer-day'] body:has(.study-archive-page)");
    expect(css).toContain(":root[data-theme='summer-night'] body:has(.study-archive-page)");
    expect(nightBodyBlock).toContain('background: var(--public-home-background);');
    expect(dayBodyBlock).toContain('linear-gradient(135deg, #cfe8f2 0%, #ddf3f4 52%, #edf8e8 100%)');
    expect(css).not.toContain(":root[data-theme='summer-day'] body:has(.study-archive-page) {\n  background: #02040b;");
    expect(dayPageBlock).toContain('--study-ink: var(--summer-ink);');
    expect(dayPageBlock).toContain('--study-muted: #7b888e;');
    expect(dayPageBlock).toContain('--study-panel: var(--summer-panel-sheen), var(--summer-panel);');
    expect(dayPageBlock).toContain('background: radial-gradient(circle at 48% 0%, rgba(255, 255, 255, 0.72), transparent 22%),');
    expect(dayPageBlock).not.toContain('linear-gradient(180deg, #f8fbff');
    expect(dayPageBlock).toContain('color: var(--study-ink);');
    expect(dayCardBlock).toContain('background: var(--study-panel-strong);');
    expect(dayCardBlock).toContain('backdrop-filter: var(--study-glass-blur);');
    expect(dayContentCardBlock).toContain('background: var(--study-panel);');
    expect(dayContentCardBlock).toContain('color: var(--study-ink);');
  });

  test('keeps the LeetCode module visually aligned with public content pages', () => {
    const css = readGlobalStyles();
    const pageTitleBlock = readStyleBlock(css, '.study-archive-page .page-title');
    const contentSectionBlock = readStyleBlock(css, '.study-archive-page .content-section');
    const sectionHeadingBlock = readStyleBlock(css, '.study-archive-page .section-heading h2');
    const studyMetricBlock = readStyleBlock(css, '.study-metric-card');
    const taskCardBlock = readStyleBlock(css, '.study-task-card');

    expect(css).not.toContain('.study-hero__copy h1');
    expect(css).not.toContain('.study-progress-orb');
    expect(pageTitleBlock).toContain('margin: 0 auto 28px;');
    expect(contentSectionBlock).toContain('border-radius: 32px;');
    expect(contentSectionBlock).toContain('backdrop-filter: var(--study-glass-blur);');
    expect(sectionHeadingBlock).toContain('font-size: clamp(1.35rem, 2.2vw, 2.1rem);');
    expect(studyMetricBlock).toContain('border-radius: 32px;');
    expect(taskCardBlock).toContain('min-height: 72px;');
    expect(taskCardBlock).toContain('padding: 14px;');
  });

  test('composes the LeetCode today tasks as a starry desk widget panel', () => {
    const css = readGlobalStyles();
    const todaySource = readStylesheet('src/app/leetcode/StudyTodaySection.tsx');
    const cardsSource = readStylesheet('src/app/leetcode/StudyCards.tsx');
    const todaySectionBlock = readStyleBlock(css, '.study-today-section');
    const summaryBlock = readStyleBlock(css, '.study-today-summary');
    const summaryStatsBlock = readStyleBlock(css, '.study-today-summary__stats');
    const rhythmTrackBlock = readStyleBlock(css, '.study-rhythm-track');
    const taskGridBlock = readStyleBlock(css, '.study-today-section .study-task-grid');
    const newTaskGroupBlock = readStyleBlock(css, '.study-task-group--new');
    const reviewTaskGroupBlock = readStyleBlock(css, '.study-task-group--review');
    const groupHeadingBlock = readStyleBlock(css, '.study-task-group__heading');
    const reviewMetaBlock = readStyleBlock(css, '.study-task-card__meta');
    const cardBodyBlock = readStyleBlock(css, '.study-task-card__body');
    const returnBlock = readStyleBlock(css, '.study-return-home');
    const responsiveCss = readStylesheet('src/app/styles/responsive.css');

    expect(todaySource).toContain('className="study-today-section"');
    expect(todaySource).toContain('study-today-summary');
    expect(todaySource).toContain('study-rhythm-track');
    expect(todaySource).toContain('study-task-group study-task-group--new');
    expect(todaySource).toContain('study-task-group study-task-group--review');
    expect(todaySource).toContain('study-task-group__heading');
    expect(todaySource).not.toContain('className="study-today-summary__card">\n          <span>每日节奏</span>');
    expect(cardsSource).toContain('study-task-card study-task-card--new');
    expect(cardsSource).toContain('study-task-card__round');
    expect(cardsSource).toContain('study-task-card__meta');
    expect(cardsSource).toContain('study-task-card__body');
    expect(todaySectionBlock).toContain('gap: clamp(18px, 3vw, 28px);');
    expect(summaryBlock).toContain('grid-template-columns: minmax(0, 0.82fr) minmax(280px, 1.18fr);');
    expect(summaryStatsBlock).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
    expect(rhythmTrackBlock).toContain('grid-template-columns: var(--study-new-share, 3fr) var(--study-review-share, 5fr);');
    expect(taskGridBlock).toContain('align-items: start;');
    expect(taskGridBlock).toContain('grid-template-columns: minmax(0, 0.94fr) minmax(0, 1.06fr);');
    expect(newTaskGroupBlock).toContain('background: transparent;');
    expect(reviewTaskGroupBlock).toContain('background: rgba(2, 6, 15, 0.24);');
    expect(groupHeadingBlock).toContain('border-bottom: 1px solid var(--study-line);');
    expect(reviewMetaBlock).toContain('font-variant-numeric: tabular-nums;');
    expect(cardBodyBlock).toContain('min-width: 0;');
    expect(returnBlock).toContain('margin: 24px auto clamp(28px, 5vw, 56px);');
    expect(responsiveCss).toContain('.study-today-section .study-task-grid');
    expect(responsiveCss).toContain('.study-today-summary');
    expect(responsiveCss).toContain('grid-template-columns: 1fr;');
  });

  test('keeps LeetCode snapshot detail controls grouped instead of splitting them across the hero', () => {
    const css = readGlobalStyles();
    const detailRowBlock = readStyleBlock(css, '.study-snapshot-detail-row');
    const detailBlock = readStyleBlock(css, '.study-snapshot-detail');
    const categoryDetailBlock = readStyleBlock(css, '.study-snapshot-detail--categories');
    const mobileDetailRowBlock =
      css.match(/@media \(max-width: 860px\) \{[\s\S]*?\.study-snapshot-detail-row\s*{(?<body>[\s\S]*?)\n  }/)
        ?.groups?.body ?? '';

    expect(detailRowBlock).toContain('display: flex;');
    expect(detailRowBlock).toContain('grid-column: 1 / -1;');
    expect(detailRowBlock).toContain('justify-content: flex-start;');
    expect(detailRowBlock).toContain('max-width: 820px;');
    expect(detailBlock).toContain('max-width: min(100%, 520px);');
    expect(categoryDetailBlock).not.toContain('justify-self: end;');
    expect(mobileDetailRowBlock).toContain('display: grid;');
  });

  test('anchors the home latest article card with the reference homepage geometry', () => {
    const css = readGlobalStyles();
    const heroContentBlock = readStyleBlock(css, '.portfolio-hero__content');
    const latestCardBlock = readStyleBlock(css, '.portfolio-hero__latest-card');
    const navBlock = readStyleBlock(css, '.portfolio-hero__card-nav');

    expect(heroContentBlock).toContain('--reference-gap: 36px;');
    expect(heroContentBlock).toContain('--reference-social-width: 315px;');
    expect(heroContentBlock).toContain('--reference-article-width: 266px;');
    expect(latestCardBlock).toContain('position: absolute;');
    expect(latestCardBlock).toContain(
      'left: calc(var(--reference-center-x) + var(--reference-hi-width) / 2 - var(--reference-social-width) - var(--reference-gap) - var(--reference-article-width));',
    );
    expect(latestCardBlock).toContain('top: calc(var(--reference-center-y) + var(--reference-hi-height) / 2 + var(--reference-gap));');
    expect(latestCardBlock).toContain('width: var(--reference-article-width);');
    expect(latestCardBlock).toContain('min-height: 160px;');
    expect(navBlock).toContain(
      'left: calc(var(--reference-center-x) - var(--reference-hi-width) / 2 - var(--reference-gap) - var(--reference-nav-width));',
    );
    expect(navBlock).toContain('top: var(--reference-nav-top);');
  });

  test('does not render the removed night milky way background layer', () => {
    const css = readGlobalStyles();
    const heroShadeBeforeBlock = readStyleBlock(css, '.portfolio-hero__shade::before');
    const heroShadeAfterBlock = readStyleBlock(css, '.portfolio-hero__shade::after');

    expect(heroShadeBeforeBlock).toContain('content: none;');
    expect(heroShadeBeforeBlock).toContain('display: none;');
    expect(heroShadeAfterBlock).toContain('content: none;');
    expect(heroShadeAfterBlock).toContain('display: none;');
    expect(css).not.toContain('night-milky-way-drift');
    expect(css).not.toContain('night-milky-dust');
    expect(css).not.toContain('linear-gradient(112deg, transparent 4%');
  });

  test('defines the README screenshot portfolio hero without the abandoned landing system', () => {
    const css = readGlobalStyles();
    const latestCardBlock = css.match(/\.portfolio-hero__latest-card\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const latestCardLinkBlock =
      css.match(/\.portfolio-hero__latest-card a\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const latestCardSummaryBlock =
      css.match(/\.portfolio-hero__latest-card small\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const likeCardBlock = css.match(/\.portfolio-hero__like-card\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const likeCardBadgeBlock = css.match(/\.portfolio-hero__like-card span\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const dayHomeBodyBlock =
      css.match(/:root\[data-theme='summer-day'\] body:has\(\.portfolio-home\)\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const dayPortfolioHomeBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-home\s*{(?<body>[\s\S]*?)\n}/)?.groups
        ?.body ?? '';
    const dayPortfolioHomeBeforeBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-home::before\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const dayHeroBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero\s*{(?<body>[\s\S]*?)\n}/)?.groups
        ?.body ?? '';
    const heroBlock = css.match(/^\.portfolio-hero\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const dayHeroBeforeBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero::before\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const dayHeroShadeBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero__shade\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const heroShadeBlock = css.match(/^\.portfolio-hero__shade\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const heroShadeBeforeBlock = readStyleBlock(css, '.portfolio-hero__shade::before');
    const heroShadeAfterBlock = readStyleBlock(css, '.portfolio-hero__shade::after');
    const dayHeroShadeBeforeBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero__shade::before\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const dayHeroShadeAfterBlock =
      [...css.matchAll(/:root\[data-theme='summer-day'\] \.portfolio-hero__shade::after\s*{(?<body>[\s\S]*?)\n}/g)]
        .at(-1)
        ?.groups?.body ?? '';
    const nightBackgroundVarBlock = css.match(/--public-home-background:\s*(?<body>[^;]+);/)?.groups?.body ?? '';
    const heroAfterBlock =
      [...css.matchAll(/^\.portfolio-hero::after\s*{(?<body>[\s\S]*?)\n}/gm)]
        .map((match) => match.groups?.body ?? '')
        .find((block) => block.includes('animation: none;')) ?? '';

    expect(css).toContain('.portfolio-home');
    expect(css).toContain('.portfolio-hero');
    expect(css).toContain('.portfolio-hero__content');
    expect(css).toContain('.portfolio-hero__left-stack');
    expect(css).toContain('.portfolio-hero__center-stack');
    expect(css).toContain('.portfolio-hero__intro-card');
    expect(css).toContain('.portfolio-hero__latest-card');
    expect(css).toContain('grid-area: nav;');
    expect(css).toContain('grid-area: latest;');
    expect(css).toContain('grid-area: intro;');
    expect(css).toContain('grid-area: actions;');
    expect(css).not.toContain('grid-area: portrait;');
    expect(css).not.toContain('grid-area: pulse;');
    expect(latestCardBlock).toContain('border-radius: 32px;');
    expect(latestCardBlock).toContain('backdrop-filter: blur(18px) saturate(1.08);');
    expect(latestCardBlock).toContain('border: 1px solid rgba(148, 163, 184, 0.26);');
    expect(latestCardBlock).toContain('rgba(4, 6, 14, 0.52)');
    expect(latestCardBlock).toContain('inset 0 0 0 1px rgba(255, 255, 255, 0.22)');
    expect(latestCardBlock).not.toContain('border: 1px solid #ffffff;');
    expect(latestCardBlock).toContain('align-self: stretch;');
    expect(latestCardBlock).toContain('justify-self: stretch;');
    expect(latestCardBlock).toContain('position: absolute;');
    expect(latestCardBlock).toContain('width: var(--reference-article-width);');
    expect(latestCardBlock).toContain('min-height: 160px;');
    expect(css).toContain('.portfolio-hero__latest-card img');
    expect(css).toContain('.portfolio-hero__latest-cover');
    expect(css).toContain('-webkit-line-clamp: 1;');
    expect(latestCardLinkBlock).toContain('grid-template-rows: auto auto auto;');
    expect(latestCardLinkBlock).toContain('align-content: center;');
    expect(latestCardSummaryBlock).toContain('-webkit-line-clamp: 1;');
    expect(css).toContain(":root[data-theme='summer-day'] .portfolio-hero__latest-card");
    expect(css).toContain(":root[data-theme='summer-day'] .portfolio-hero__intro-card");
    expect(css).toContain('.portfolio-hero__like-card');
    expect(css).toContain('.portfolio-hero__like-row');
    expect(likeCardBlock).toContain('border: 1px solid rgba(148, 163, 184, 0.26);');
    expect(likeCardBlock).toContain('backdrop-filter: blur(18px) saturate(1.08);');
    expect(likeCardBlock).toContain('inset 0 0 0 1px rgba(255, 255, 255, 0.22)');
    expect(likeCardBlock).not.toContain('border: 1px solid #ffffff;');
    expect(likeCardBlock).toContain('border-radius: 999px;');
    expect(likeCardBlock).toContain('height: 48px;');
    expect(likeCardBlock).toContain('width: 48px;');
    expect(likeCardBlock).toContain('padding: 9px;');
    expect(likeCardBlock).toContain('overflow: visible;');
    expect(css).toContain('.portfolio-hero__like-card span');
    expect(likeCardBadgeBlock).toContain('min-width: 28px;');
    expect(likeCardBadgeBlock).toContain('left: 28px;');
    expect(likeCardBadgeBlock).toContain('top: -8px;');
    expect(css).toContain(":root[data-theme='summer-day'] .portfolio-hero__like-card");
    expect(css).toContain('.portfolio-hero__name');
    expect(css).toContain('.portfolio-hero__role');
    expect(css).not.toContain('.portfolio-hero__info-panel');
    expect(css).not.toContain('.portfolio-hero__stats');
    expect(css).not.toContain('.portfolio-hero__stat-icon');
    expect(css).toContain('.portfolio-hero__actions');
    expect(css).toContain('border-top: 1px solid rgba(148, 163, 184, 0.1);');
    expect(css).toContain('.portfolio-hero__visual');
    expect(css).toContain('.portfolio-hero__portrait');
    expect(css).not.toContain('.portfolio-hero__status-card');
    expect(css).toContain('.portfolio-hero__night-avatar');
    expect(css).toContain('.portfolio-hero__day-avatar');
    expect(css).toContain('.portfolio-hero__shade::before');
    expect(css).toContain('.portfolio-hero__shade::after');
    expect(heroShadeBeforeBlock).toContain('content: none;');
    expect(heroShadeBeforeBlock).toContain('display: none;');
    expect(heroShadeAfterBlock).toContain('content: none;');
    expect(heroShadeAfterBlock).toContain('display: none;');
    expect(css).not.toContain('@keyframes night-milky-way-drift');
    expect(css).not.toContain('@keyframes night-milky-dust');
    expect(css).toContain(":root[data-theme='summer-day'] .portfolio-hero__actions");
    expect(css).toContain(":root[data-theme='summer-day'] .portfolio-hero__night-avatar");
    expect(css).toContain(":root[data-theme='summer-day'] .portfolio-hero__day-avatar");
    expect(css).not.toContain('.portfolio-hero__signal');
    expect(css).not.toContain('.portfolio-hero__scroll');
    expect(css).not.toContain('data-scroll-locked');
    expect(css).not.toContain("data-anchor-active='true'");
    expect(css).not.toContain('@keyframes home-anchor-rise');
    expect(css).not.toContain('@keyframes scroll-entry-breathe');
    expect(css).not.toContain('@keyframes scroll-arrow-drop');
    expect(css).not.toContain('@keyframes scroll-star-fall');
    expect(css).not.toContain('@keyframes scroll-wave-drift');
    expect(css).not.toContain('@keyframes shore-wave-runup');
    expect(css).not.toContain('@keyframes shore-wave-return');
    expect(css).not.toContain('@keyframes shore-foam-runup');
    expect(css).not.toContain('@keyframes shore-wet-sheen');
    expect(css).not.toContain('@keyframes shore-crest-sweep');
    expect(css).not.toContain('@keyframes shore-surge-wash');
    expect(css).not.toContain('@keyframes shore-surge-foam');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(readStylesheet('src/app/page.tsx')).toContain('BlurredBubblesCanvas');
    expect(css).toContain('.portfolio-hero__bubbles');
    expect(css).toContain('filter: blur(50px) saturate(1.12);');
    expect(css).toContain('opacity: 0;');
    expect(css).toContain('.portfolio-hero__canvas');
    expect(css).toContain('min-height: 100vh;');
    expect(css).toContain('.theme-toggle');
    expect(css).toContain('.portfolio-hero::before');
    expect(css).toContain('.portfolio-hero::after');
    expect(css).toContain('animation: night-sky-drift');
    expect(css).toContain('@keyframes night-sky-drift');
    expect(nightBackgroundVarBlock.trim()).toBe('#02040b');
    expect(heroBlock).toContain('background: #02040b;');
    expect(heroAfterBlock).toContain('animation: none;');
    expect(heroAfterBlock).toContain('background: transparent;');
    expect(heroAfterBlock).toContain('opacity: 0;');
    expect(heroShadeBlock).toContain('background: transparent;');
    expect(heroShadeBlock).not.toContain('linear-gradient');
    expect(heroShadeBlock).not.toContain('radial-gradient');
    expect(css).toContain(':root[data-theme=\'summer-day\'] .portfolio-home');
    expect(css).toContain('#d4e8f3');
    expect(dayHomeBodyBlock).toContain('background: #d4e8f3;');
    expect(dayHomeBodyBlock).not.toContain('rgba(238, 221, 142, 0.26)');
    expect(dayPortfolioHomeBlock).toContain('background: #d4e8f3;');
    expect(dayPortfolioHomeBlock).not.toContain('rgba(238, 221, 142, 0.26)');
    expect(dayHeroBlock).toContain('background: transparent;');
    expect(dayHomeBodyBlock).not.toContain('radial-gradient');
    expect(dayPortfolioHomeBlock).not.toContain('radial-gradient');
    expect(dayHeroBlock).not.toContain('linear-gradient');
    expect(dayHeroBlock).not.toContain('radial-gradient');
    expect(css).toContain('--summer-sky');
    expect(css).toContain('--summer-cloud');
    expect(css).toContain('--summer-sea');
    expect(readStylesheet('src/components/BlurredBubblesCanvas.tsx')).toContain("const fallbackDayGlowColors = ['#fff0a3a8', '#8fdbe9', '#fffef8'];");
    expect(readStylesheet('src/components/BlurredBubblesCanvas.tsx')).toContain("readRootColor('--summer-glow-warm'");
    expect(readStylesheet('src/components/BlurredBubblesCanvas.tsx')).toContain("readRootColor('--summer-glow-sea'");
    expect(readStylesheet('src/components/BlurredBubblesCanvas.tsx')).toContain("readRootColor('--summer-glow-cloud'");
    expect(readStylesheet('src/components/BlurredBubblesCanvas.tsx')).toContain("const warmGlowColor = dayGlowColors[0] ?? '#fff0a3a8';");
    expect(readStylesheet('src/components/BlurredBubblesCanvas.tsx')).toContain('const color = dayGlowColors[nextBubbles.length % dayGlowColors.length]');
    expect(readStylesheet('src/components/BlurredBubblesCanvas.tsx')).toContain('const r = isWarmGlow ? rand(250, 360) : rand(minRadius, maxRadius);');
    expect(readStylesheet('src/components/BlurredBubblesCanvas.tsx')).toContain('const x = isWarmGlow ? rand(-r * 0.3, width * 0.68) : rand(-r / 2, width + r / 2);');
    expect(readStylesheet('src/components/BlurredBubblesCanvas.tsx')).toContain('const y = isWarmGlow ? rand(height * 0.68, height * 1.02) : rand(height * bottomBandStart, height * 1.2);');
    expect(readStylesheet('src/components/BlurredBubblesCanvas.tsx')).toContain('alpha: isWarmGlow ? 0.62 : 0.8,');
    expect(readStylesheet('src/components/BlurredBubblesCanvas.tsx')).toContain('blur: isWarmGlow ? rand(220, 360) : rand(200, 400),');
    expect(readStylesheet('src/components/BlurredBubblesCanvas.tsx')).toContain('context.globalAlpha = bubble.alpha;');
    expect(readStylesheet('src/components/BlurredBubblesCanvas.tsx')).toContain('const bottomBandStart = 0.8;');
    expect(readStylesheet('src/components/BlurredBubblesCanvas.tsx')).toContain('const targetFrameMs = 1000 / 6;');
    expect(css).toContain(":root[data-theme='summer-day'] .portfolio-home::before");
    expect(css).toContain(":root[data-theme='summer-day'] .portfolio-home::after");
    expect(dayPortfolioHomeBeforeBlock).toContain('height: 0;');
    expect(dayPortfolioHomeBeforeBlock).toContain('opacity: 0;');
    expect(css).toContain(":root[data-theme='summer-day'] .portfolio-hero__bubbles");
    expect(css).toContain('filter: blur(50px);');
    expect(css).toContain('opacity: 1;');
    expect(css).toContain(':root[data-theme=\'summer-day\'] .portfolio-hero__canvas');
    expect(readStylesheet('src/components/StarrySkyCanvas.tsx')).toContain('Math.floor(190 * density) + 70');
    expect(readStylesheet('src/components/StarrySkyCanvas.tsx')).toContain('SHOOTING_STAR_INTERVAL_FRAMES = 520');
    expect(readStylesheet('src/components/StarrySkyCanvas.tsx')).toContain('time % SHOOTING_STAR_INTERVAL_FRAMES === 0');
    expect(readStylesheet('src/components/StarrySkyCanvas.tsx')).toContain('MAX_SHIP_SCREEN_RATIO = 0.045');
    expect(readStylesheet('src/components/starry-sky-encounters.ts')).toContain('SHIP_APPEAR_INTERVAL_MS = 2 * 60 * 1000');
    expect(readStylesheet('src/components/starry-sky-encounters.ts')).not.toContain('SMALL_SHIP_WEIGHT');
    expect(readStylesheet('src/components/starry-sky-encounters.ts')).not.toContain('FLAGSHIP_WEIGHT');
    expect(readStylesheet('src/components/StarrySkyCanvas.tsx')).not.toContain('selectFleetEncounterVariant');
    expect(readStylesheet('src/components/StarrySkyCanvas.tsx')).toContain('let activeSmallStarship');
    expect(readStylesheet('src/components/StarrySkyCanvas.tsx')).not.toContain('let activeStarship');
    expect(readStylesheet('src/components/StarrySkyCanvas.tsx')).toContain('if (!activeSmallStarship && now >= nextShipAt)');
    expect(readStylesheet('src/components/StarrySkyCanvas.tsx')).not.toContain('fleet.forEach');
    expect(readStylesheet('src/components/StarrySkyCanvas.tsx')).not.toContain('FLEET_SIZE = 2');
    expect(readStylesheet('src/components/StarrySkyCanvas.tsx')).toContain('createExplorationFleet');
    expect(readStylesheet('src/components/StarrySkyCanvas.tsx')).toContain("variant: 'scout'");
    expect(readStylesheet('src/components/StarrySkyCanvas.tsx')).toContain("variant: 'voyager'");
    expect(readStylesheet('src/components/StarrySkyCanvas.tsx')).toContain('drawStarship');
    expect(readStylesheet('src/components/StarrySkyCanvas.tsx')).toContain('drawVoyagerStarship');
    expect(readStylesheet('src/components/StarrySkyCanvas.tsx')).toContain('drawNebula');
    expect(readStylesheet('src/components/StarrySkyCanvas.tsx')).toContain('createRadialGradient');
    expect(readStylesheet('src/components/StarrySkyCanvas.tsx')).not.toContain('LightDust');
    expect(readStylesheet('src/components/StarrySkyCanvas.tsx')).not.toContain('MistLayer');
    expect(css).toContain(":root[data-theme='summer-day'] .portfolio-hero__shade::before");
    expect(css).toContain(":root[data-theme='summer-day'] .portfolio-hero__shade::after");
    expect(dayHeroBeforeBlock).toContain('background: transparent;');
    expect(dayHeroBeforeBlock).toContain('opacity: 0;');
    expect(dayHeroShadeBlock).toContain('background: transparent;');
    expect(dayHeroShadeBeforeBlock).toContain('animation: none;');
    expect(dayHeroShadeBeforeBlock).toContain('background: transparent;');
    expect(dayHeroShadeBeforeBlock).toContain('opacity: 0;');
    expect(dayHeroShadeAfterBlock).toContain('animation: none;');
    expect(dayHeroShadeAfterBlock).toContain('background: transparent;');
    expect(dayHeroShadeAfterBlock).toContain('opacity: 0;');
    expect(css).not.toContain('.home-landing');
    expect(css).not.toContain('.home-overview');
    expect(css).not.toContain('animation: home-scroll-float');
    expect(css).not.toContain('font-size: clamp(3.2rem, 7vw, 6.8rem);');
    expect(css).not.toContain('font-size: clamp(4.2rem, 15vw, 12.5rem);');
    expect(css).toContain('var(--cyber-cyan)');
    expect(css).not.toContain('#CCFF00');
    expect(css).not.toContain('#ccff00');
  });

  test('keeps a distinct avatar for the summer night and day home themes', () => {
    const css = readGlobalStyles();
    const nightAvatarBlock = css.match(/\.portfolio-hero__night-avatar\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const summerDayHiddenNightBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero__night-avatar\s*{(?<body>[\s\S]*?)\n}/)?.groups
        ?.body ?? '';
    const summerDayAvatarBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero__day-avatar\s*{(?<body>[\s\S]*?)\n}/)?.groups
        ?.body ?? '';

    expect(nightAvatarBlock).toContain('display: block;');
    expect(css).toMatch(/\.portfolio-hero__day-avatar\s*{\s*display: none;\s*}/);
    expect(summerDayHiddenNightBlock).toContain('display: none;');
    expect(summerDayAvatarBlock).toContain('display: block;');
  });

  test('does not keep the abandoned layered overview information grid', () => {
    const css = readGlobalStyles();
    const responsiveCss = readStylesheet('src/app/styles/responsive.css');

    expect(css).not.toContain('.home-overview');
    expect(css).not.toContain('.home-overview__grid');
    expect(css).not.toContain('.home-overview__panel');
    expect(css).not.toContain('.home-overview__panel--intro');
    expect(css).not.toContain('.home-overview__panel--featured');
    expect(css).not.toContain('.home-overview__panel--projects');
    expect(css).not.toContain('.home-overview__panel--stack');
    expect(css).not.toContain('.home-overview__panel--contact');
    expect(css).not.toContain('.home-overview__panel--stats');
    expect(css).not.toContain('"article core signal"');
    expect(css).not.toContain('.home-widget-card');
    expect(responsiveCss).not.toContain('.home-overview__grid');
    expect(responsiveCss).not.toContain('.home-overview__panel');
    expect(css).not.toContain('#CCFF00');
    expect(css).not.toContain('#ccff00');
  });

  test('keeps the home dashboard in the summer day theme', () => {
    const css = readGlobalStyles();
    const dayDashboardBlock =
      css.match(/:root\[data-theme='summer-day'\] \.home-dashboard\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const dayFocusCardBlock =
      css.match(/:root\[data-theme='summer-day'\] \.home-focus a\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const dayHomeHeadingBlock =
      css.match(/:root\[data-theme='summer-day'\] \.home-profile h2\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';

    expect(css).toContain(":root[data-theme='summer-day'] .home-dashboard");
    expect(css).toContain(":root[data-theme='summer-day'] .home-profile h2");
    expect(css).toContain(":root[data-theme='summer-day'] .home-focus a");
    expect(css).toContain('--summer-glow-warm: #fff0a3a8;');
    expect(css).toContain('--summer-warm-rgb: 255, 240, 163;');
    expect(css).toContain('--summer-sea-rgb: 8, 116, 127;');
    expect(dayDashboardBlock).toContain('rgba(var(--summer-warm-rgb), 0.2)');
    expect(dayDashboardBlock).toContain('var(--summer-archive-grid)');
    expect(dayDashboardBlock).toContain('background-size: 160% 100%');
    expect(dayDashboardBlock).not.toContain('#07100f');
    expect(dayFocusCardBlock).toContain('var(--summer-panel)');
    expect(dayFocusCardBlock).toContain('var(--summer-panel-sheen)');
    expect(dayFocusCardBlock).toContain('var(--summer-glint)');
    expect(dayHomeHeadingBlock).toContain('var(--summer-ink)');
  });

  test('styles the home writing, notes, moments, and archive modules as lightweight personal-site sections', () => {
    const css = readGlobalStyles();
    const responsiveCss = readStylesheet('src/app/styles/responsive.css');
    const journalItemBlock = css.match(/\.home-journal-list a\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const dayJournalBlock =
      css.match(
        /:root\[data-theme='summer-day'\] \.home-journal-list a,[\s\S]*?\.home-archive-links a\s*{(?<body>[\s\S]*?)\n}/,
      )?.groups?.body ?? '';
    const dayJournalMetaBlock =
      css.match(
        /:root\[data-theme='summer-day'\] \.home-journal-list span,[\s\S]*?\.home-archive-links span\s*{(?<body>[\s\S]*?)\n}/,
      )?.groups?.body ?? '';

    expect(css).toContain('.home-journal-list');
    expect(css).toContain('.home-moment-strip');
    expect(css).toContain('.home-archive-links');
    expect(css).toContain('.content-section--journal');
    expect(css).toContain('.content-section--moments');
    expect(css).toContain('.content-section--archive');
    expect(journalItemBlock).toContain('grid-template-columns: minmax(90px, 0.18fr) minmax(160px, 0.32fr) minmax(0, 1fr);');
    expect(journalItemBlock).toContain('min-height: 84px;');
    expect(css).toContain('grid-template-columns: repeat(3, minmax(0, 1fr));');
    expect(dayJournalBlock).toContain('rgba(var(--summer-warm-rgb), 0.22)');
    expect(dayJournalBlock).toContain('var(--summer-line)');
    expect(dayJournalMetaBlock).toContain('color: #9a6a00;');
    expect(responsiveCss).toContain('.home-journal-list a');
    expect(responsiveCss).toContain('.home-moment-strip');
    expect(responsiveCss).toContain('.home-archive-links');
  });

  test('removes unused non-interactive summer detail decorations', () => {
    const css = readGlobalStyles();

    expect(css).not.toContain('.summer-detail-field');
    expect(css).not.toContain('.summer-detail--cola');
    expect(css).not.toContain('.summer-detail--lemon');
    expect(css).not.toContain('.summer-detail--surfboard');
    expect(css).not.toContain('.summer-detail--ice');
    expect(css).not.toContain('.summer-detail--sun-glass');
    expect(css).not.toContain('@keyframes summer-detail-bob');
  });

  test('keeps the portfolio home navigation visible while preserving the full-screen hero', () => {
    const css = readGlobalStyles();
    const heroBlock = css.match(/\n\.portfolio-hero\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const portfolioHomeBlock = css.match(/\.portfolio-home,[\s\S]*?\.portfolio-about-panel\s*{(?<body>[\s\S]*?)\n}/)?.groups
      ?.body ?? '';

    expect(heroBlock).toContain('min-height: 100vh;');
    expect(portfolioHomeBlock).toContain('color: var(--cyber-ink);');
    expect(css).toContain('--home-header-height: 67px;');
    expect(css).toContain('body:has(.portfolio-home) .portfolio-hero {');
    expect(css).toContain('min-height: 100svh;');
    expect(css).toContain('body:has(.portfolio-home) .portfolio-hero .cyber-home__container');
    expect(css).toContain('.portfolio-hero__card-nav');
    expect(css).toContain('.portfolio-hero__nav-card');
    expect(css).toContain('.portfolio-hero__nav-brand');
    expect(css).toContain('.portfolio-hero__nav-links');
    expect(css).not.toContain('body:has(.portfolio-home) .site-footer');
  });

  test('styles the home photo album as a scroll-snapping cyber gallery', () => {
    const css = readGlobalStyles();

    expect(css).toContain('.home-photo-album');
    expect(css).toContain('.home-photo-album__track');
    expect(css).toContain('scroll-snap-type: x mandatory;');
    expect(css).toContain('.home-photo-album__slide');
    expect(css).toContain('scroll-snap-align: center;');
    expect(css).toContain('.home-photo-album__control');
  });

  test('styles the shared navigation as a reference-style floating nav card', () => {
    const css = readGlobalStyles();
    const responsiveCss = readStylesheet('src/app/styles/responsive.css');
    const siteHeaderBlock = css.match(/^\.site-header\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const siteNavItemsBlocks = [...css.matchAll(/^\.site-nav__items\s*{(?<body>[\s\S]*?)\n}/gm)];
    const siteNavItemsBlock = siteNavItemsBlocks.at(-1)?.groups?.body ?? '';
    const siteNavHoverBlock = css.match(/\.site-nav__hover\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const siteNavLinkBlock = css.match(/\.site-nav a\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const siteNavActiveIconBlock =
      css.match(/\.site-nav a\[data-hovered='true'\] \.site-nav__icon,[\s\S]*?\.site-nav a\[aria-current='page'\] \.site-nav__icon\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const mobileSiteNavItemsBlock =
      responsiveCss.match(/\.site-nav__items\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';

    expect(css).toContain('.site-header');
    expect(css).toContain('.site-nav-card');
    expect(css).toContain('.site-nav-card__brand');
    expect(css).toContain('.site-nav-card__tools');
    expect(css).toContain('.brand-avatar');
    expect(css).toContain('.site-nav__items');
    expect(css).toContain('.site-nav');
    expect(siteHeaderBlock).toContain('display: flex;');
    expect(siteHeaderBlock).toContain('width: 388px;');
    expect(siteHeaderBlock).toContain('border-radius: 24px;');
    expect(siteHeaderBlock).toContain('min-height: 64px;');
    expect(siteHeaderBlock).toContain('gap: 14px;');
    expect(siteHeaderBlock).toContain('padding: 12px;');
    expect(siteHeaderBlock).toContain('backdrop-filter: blur(18px) saturate(1.08);');
    expect(css).toContain('.site-nav__icon');
    expect(css).toContain('.site-nav__icon::before');
    expect(css).toContain('.site-nav__icon::after');
    expect(css).toContain('.site-nav__label');
    expect(css).toContain('.site-nav__hover');
    expect(css).toContain(".site-nav a[aria-current='page']");
    expect(siteNavItemsBlock).toContain('--nav-hover-extra: 8px;');
    expect(siteNavItemsBlock).toContain('--nav-hover-size: calc(var(--nav-item-size) + var(--nav-hover-extra) * 2);');
    expect(siteNavItemsBlock).toContain('--nav-item-gap: 24px;');
    expect(siteNavItemsBlock).toContain('--nav-item-size: 28px;');
    expect(siteNavItemsBlock).toContain('display: flex;');
    expect(siteNavItemsBlock).toContain('position: relative;');
    expect(siteNavHoverBlock).toContain('height: var(--nav-hover-size);');
    expect(siteNavHoverBlock).toContain('width: var(--nav-hover-size);');
    expect(siteNavHoverBlock).toContain('will-change: transform;');
    expect(siteNavHoverBlock).toContain('linear-gradient(to right bottom, rgba(148, 163, 184, 0.22) 60%, rgba(15, 23, 42, 0.42) 100%)');
    expect(siteNavHoverBlock).toContain('box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);');
    expect(siteNavHoverBlock).toContain('top: calc(var(--nav-hover-extra) * -1);');
    expect(siteNavHoverBlock).toContain('transform: translate3d(calc(var(--hover-index, var(--active-index, 0)) * (var(--nav-item-size) + var(--nav-item-gap)) - var(--nav-hover-extra)), 0, 0);');
    expect(siteNavHoverBlock).toContain('transition:');
    expect(siteNavHoverBlock).toContain('cubic-bezier(0.34, 1.56, 0.64, 1)');
    expect(siteNavHoverBlock).toContain('pointer-events: none;');
    expect(siteNavLinkBlock).toContain('font-family: var(--font-nav);');
    expect(siteNavLinkBlock).toContain('font-weight: 400;');
    expect(siteNavLinkBlock).toContain('letter-spacing: 0;');
    expect(siteNavLinkBlock).toContain('min-height: var(--nav-item-size);');
    expect(siteNavLinkBlock).toContain('width: var(--nav-item-size);');
    expect(siteNavLinkBlock).toContain('padding: 0;');
    expect(siteNavLinkBlock).toContain('display: inline-flex;');
    expect(siteNavLinkBlock).toContain('z-index: 1;');
    expect(siteNavActiveIconBlock).toContain('color: var(--cyber-cyan);');
    expect(siteNavActiveIconBlock).toContain('transform: scale(1.04);');
    expect(responsiveCss).toContain('--nav-item-size: 28px;');
    expect(responsiveCss).toContain('--nav-item-gap: 24px;');
    expect(mobileSiteNavItemsBlock).toContain('overflow-x: auto;');
    expect(mobileSiteNavItemsBlock).toContain('scrollbar-width: none;');
    expect(css).toContain('.portfolio-hero__card-nav');
  });

  test('uses a single card navigation on the portfolio home page while keeping the night skin dark', () => {
    const css = readGlobalStyles();
    const homeNavBlock = css.match(/^\.portfolio-hero__nav-card\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const homeNavInteractiveBlock =
      css.match(
        /\.portfolio-hero__nav-card:hover,[\s\S]*?\.portfolio-hero__nav-card:focus-within\s*{(?<body>[\s\S]*?)\n}/,
      )?.groups?.body ?? '';
    const homeNavLinksBlock = css.match(/\.portfolio-hero__nav-links\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const homeNavLinkBlock = css.match(/\.portfolio-hero__nav-links a\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const homeNavBrandBlock = css.match(/\.portfolio-hero__nav-brand strong\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const homeNavFooterBlock = css.match(/\.portfolio-hero__nav-footer\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const homeNavThemeBlock = css.match(/\.portfolio-hero__nav-theme\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const homeNavAvatarDayBlock =
      css.match(/\.portfolio-hero__nav-brand \.portfolio-hero__nav-avatar--day\s*{(?<body>[\s\S]*?)\n}/)?.groups
        ?.body ?? '';
    const dayHomeNavAvatarNightBlock =
      css.match(
        /:root\[data-theme='summer-day'\] \.portfolio-hero__nav-brand \.portfolio-hero__nav-avatar--night\s*{(?<body>[\s\S]*?)\n}/,
      )?.groups?.body ?? '';
    const dayHomeNavAvatarDayBlock =
      css.match(
        /:root\[data-theme='summer-day'\] \.portfolio-hero__nav-brand \.portfolio-hero__nav-avatar--day\s*{(?<body>[\s\S]*?)\n}/,
      )?.groups?.body ?? '';
    const homeNavKickerBlock = css.match(/^\.portfolio-hero__nav-kicker\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const homeHeroContentBlock = css.match(/\.portfolio-hero__content\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const homeIntroBlock = css.match(/^\.portfolio-hero__intro-card\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const homeHiAvatarBlock =
      css.match(/^\.portfolio-hero__hi-avatar\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const homeHiAvatarImageBlock =
      css.match(/^\.portfolio-hero__hi-avatar img\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const homeHiGreetingBlock =
      css.match(/^\.portfolio-hero__hi-greeting\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const homeHiLineBlock =
      css.match(/^\.portfolio-hero__hi-line\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const homeHiMeetLineBlock =
      css.match(/^\.portfolio-hero__hi-line--meet\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const homeHiNameBlock =
      css.match(/^\.portfolio-hero__hi-name\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const homeVisualBlock = css.match(/^\.portfolio-hero__visual\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const homeSkyBlock = css.match(/^\.portfolio-hero__sky-card\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const homeSkyImageBlock = css.match(/^\.portfolio-hero__sky-image\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const homeSkyImageDayBlock =
      css.match(/^\.portfolio-hero__sky-image--day\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const homeSkyImageNightBlock =
      css.match(/^\.portfolio-hero__sky-image--night\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const daySkyImageDayBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero__sky-image--day\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const daySkyImageNightBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero__sky-image--night\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const homeActionsBlock = css.match(/^\.portfolio-hero__actions\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const homeLeetCodeBlock =
      css.match(/^\.portfolio-hero__leetcode-card\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const homeLeetCodeIconBlock =
      css.match(/^\.portfolio-hero__leetcode-icon\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const homeLeetCodeMarkBlock =
      css.match(/^\.portfolio-hero__leetcode-mark\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const homeLeetCodeStatusBlock =
      css.match(/^\.portfolio-hero__leetcode-status\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const homeClockBlock = css.match(/^\.portfolio-hero__clock-card\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const homeCalendarBlock =
      [...css.matchAll(/^\.portfolio-hero__calendar-card\s*{(?<body>[\s\S]*?)\n}/gm)]
        .map((match) => match.groups?.body ?? '')
        .find((block) => block.includes('width: var(--reference-calendar-width);')) ?? '';
    const dayHomeNavBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero__nav-card\s*{(?<body>[\s\S]*?)\n}/)?.groups
        ?.body ?? '';
    const dayHomeNavLinkBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero__nav-links a\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const dayHomeNavActiveBlock =
      css.match(
        /:root\[data-theme='summer-day'\] \.portfolio-hero__nav-links a\[data-active='true'\],[\s\S]*?:root\[data-theme='summer-day'\] \.portfolio-hero__nav-links a:focus-visible\s*{(?<body>[\s\S]*?)\n}/,
      )?.groups?.body ?? '';
    const dayHomeNavFooterBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero__nav-footer\s*{(?<body>[\s\S]*?)\n}/)?.groups
        ?.body ?? '';
    const dayHomeNavThemeBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero__nav-theme\s*{(?<body>[\s\S]*?)\n}/)?.groups
        ?.body ?? '';
    const dayHomePanelBlock =
      css.match(
        /:root\[data-theme='summer-day'\] \.portfolio-hero__intro-card,[\s\S]*?:root\[data-theme='summer-day'\] \.home-photo-album__viewport\s*{(?<body>[\s\S]*?)\n}/,
      )?.groups?.body ?? '';
    const dayHomeLatestBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero__latest-card\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const dayHomeLikeBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero__like-card\s*{(?<body>[\s\S]*?)\n}/)?.groups
        ?.body ?? '';
    const dayHomeClockBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero__clock-card\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const dayHomeClockDigitsBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero__clock-digits\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const dayHomeClockSegmentBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero__clock-segment\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const dayHomeClockActiveSegmentBlock =
      css.match(
        /:root\[data-theme='summer-day'\] \.portfolio-hero__clock-segment\[data-active='true'\]\s*{(?<body>[\s\S]*?)\n}/,
      )?.groups?.body ?? '';
    const dayHomeClockColonBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero__clock-colon i\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const dayCalendarBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero__calendar-card\s*{(?<body>[\s\S]*?)\n}/)?.groups
        ?.body ?? '';
    const dayCalendarCurrentBlock =
      css.match(
        /:root\[data-theme='summer-day'\] \.portfolio-hero__calendar-card li\[data-current='true'\]\s*{(?<body>[\s\S]*?)\n}/,
      )?.groups?.body ?? '';

    expect(css).toContain('.portfolio-hero__card-nav');
    expect(homeHeroContentBlock).toContain('display: block;');
    expect(homeHeroContentBlock).toContain('--reference-center-x: 50%;');
    expect(homeHeroContentBlock).toContain('--reference-center-y: clamp(420px, 47.5svh, 500px);');
    expect(homeHeroContentBlock).toContain('--reference-gap: 36px;');
    expect(homeHeroContentBlock).toContain('--reference-hi-width: 360px;');
    expect(homeHeroContentBlock).toContain('--reference-hi-height: 260px;');
    expect(homeHeroContentBlock).toContain('--reference-art-width: 360px;');
    expect(homeHeroContentBlock).toContain('--reference-art-height: 188px;');
    expect(homeHeroContentBlock).toContain('--reference-clock-width: 232px;');
    expect(homeHeroContentBlock).toContain('--reference-clock-height: 132px;');
    expect(homeHeroContentBlock).toContain('--reference-clock-offset: 92px;');
    expect(homeHeroContentBlock).toContain('--reference-portrait-clock-gap: 24px;');
    expect(homeHeroContentBlock).toContain('--reference-calendar-width: 350px;');
    expect(homeHeroContentBlock).toContain('--reference-leetcode-width: 280px;');
    expect(homeHeroContentBlock).toContain('--reference-calendar-height: 264px;');
    expect(homeHeroContentBlock).toContain('--reference-social-width: 315px;');
    expect(homeHeroContentBlock).toContain('--reference-article-width: 266px;');
    expect(homeHeroContentBlock).toContain('--reference-nav-width: 280px;');
    expect(homeHeroContentBlock).toContain('--reference-nav-height: 398px;');
    expect(homeHeroContentBlock).toContain('--reference-nav-top: calc(var(--reference-center-y) + var(--reference-hi-height) / 2 - var(--reference-nav-height));');
    expect(homeHeroContentBlock).toContain('--reference-portrait-width: 146px;');
    expect(homeHeroContentBlock).toContain('padding: 0;');
    expect(homeIntroBlock).toContain('position: absolute;');
    expect(homeIntroBlock).toContain('left: calc(var(--reference-center-x) - var(--reference-hi-width) / 2);');
    expect(homeIntroBlock).toContain('top: calc(var(--reference-center-y) - var(--reference-hi-height) / 2);');
    expect(homeIntroBlock).toContain('height: var(--reference-hi-height);');
    expect(homeIntroBlock).toContain('width: var(--reference-hi-width);');
    expect(homeIntroBlock).toContain('min-height: var(--reference-hi-height);');
    expect(homeIntroBlock).toContain('backdrop-filter: blur(18px) saturate(1.08);');
    expect(homeIntroBlock).toContain('border: 1px solid rgba(148, 163, 184, 0.26);');
    expect(homeIntroBlock).toContain('rgba(4, 6, 14, 0.54)');
    expect(homeIntroBlock).toContain('inset 0 0 0 1px rgba(255, 255, 255, 0.22)');
    expect(homeIntroBlock).not.toContain('border: 1px solid #ffffff;');
    expect(homeHiAvatarBlock).toContain('height: 82px;');
    expect(homeHiAvatarBlock).toContain('width: 82px;');
    expect(homeHiAvatarBlock).toContain('border-radius: 50%;');
    expect(homeHiAvatarImageBlock).toContain('object-fit: cover;');
    expect(homeHiGreetingBlock).toContain('font-family: var(--font-display);');
    expect(homeHiGreetingBlock).toContain('font-size: clamp(1.55rem, 2.45vw, 1.8rem);');
    expect(homeHiLineBlock).toContain('overflow-wrap: anywhere;');
    expect(homeHiMeetLineBlock).toContain('max-width: 8.2ch;');
    expect(homeHiNameBlock).toContain('background: linear-gradient(92deg, #22d3ee 0%, #38bdf8 44%, #a78bfa 100%);');
    expect(homeHiNameBlock).toContain('background-clip: text;');
    expect(homeHiNameBlock).toContain('-webkit-text-fill-color: transparent;');
    expect(homeHiNameBlock).toContain('overflow-wrap: anywhere;');
    expect(homeNavBlock).toContain('display: grid;');
    expect(homeNavBlock).toContain('gap: 0;');
    expect(homeNavBlock).toContain('align-content: start;');
    expect(homeNavBlock).toContain('border-radius: 40px;');
    expect(homeNavBlock).toContain('backdrop-filter: blur(4px);');
    expect(homeNavBlock).toContain('height: var(--reference-nav-height);');
    expect(homeNavBlock).toContain('min-height: var(--reference-nav-height);');
    expect(homeNavBlock).toContain('padding: 18px;');
    expect(homeNavBlock).toContain('rgba(4, 6, 14, 0.6)');
    expect(homeNavBlock).not.toContain('rgba(232, 246, 249, 0.86)');
    expect(homeNavInteractiveBlock).toContain('border-color: rgba(148, 163, 184, 0.36);');
    expect(homeNavInteractiveBlock).not.toContain('border-color: rgba(34, 211, 238, 0.32);');
    expect(css).toContain('--reference-home-card-bg: #ffffff66;');
    expect(css).toContain('--reference-home-card-backdrop: blur(4px);');
    expect(css).toContain('--reference-home-card-border: #ffffff;');
    expect(css).toContain('--reference-home-card-radius: 40px;');
    expect(css).toContain('0 40px 50px -32px rgba(0, 0, 0, 0.05)');
    expect(css).toContain('inset 0 0 20px rgba(255, 255, 255, 0.25)');
    expect(dayHomeNavBlock).toContain('background: var(--reference-home-card-bg);');
    expect(dayHomeNavBlock).toContain('border-radius: var(--reference-home-card-radius);');
    expect(dayHomeNavBlock).toContain('border-color: var(--reference-home-card-border);');
    expect(dayHomeNavBlock).toContain('box-shadow: var(--reference-home-card-shadow);');
    expect(dayHomeNavBlock).not.toContain('rgba(4, 6, 14, 0.6)');
    expect(dayHomePanelBlock).toContain('background: var(--reference-home-card-bg);');
    expect(dayHomePanelBlock).toContain('backdrop-filter: var(--reference-home-card-backdrop);');
    expect(dayHomePanelBlock).toContain('border-color: var(--reference-home-card-border);');
    expect(dayHomePanelBlock).toContain('border-radius: var(--reference-home-card-radius);');
    expect(dayHomePanelBlock).toContain('box-shadow: var(--reference-home-card-shadow);');
    expect(dayHomeLatestBlock).toContain('background: var(--reference-home-card-bg);');
    expect(dayHomeLatestBlock).toContain('backdrop-filter: var(--reference-home-card-backdrop);');
    expect(dayHomeLatestBlock).toContain('border-color: var(--reference-home-card-border);');
    expect(dayHomeLatestBlock).toContain('border-radius: var(--reference-home-card-radius);');
    expect(dayHomeLatestBlock).toContain('box-shadow: var(--reference-home-card-shadow);');
    expect(dayHomeLikeBlock).toContain('background: var(--reference-home-card-bg);');
    expect(dayHomeLikeBlock).toContain('backdrop-filter: var(--reference-home-card-backdrop);');
    expect(dayHomeLikeBlock).toContain('border-color: var(--reference-home-card-border);');
    expect(dayHomeLikeBlock).toContain('box-shadow: var(--reference-home-card-shadow);');
    expect(dayHomeClockBlock).toContain('backdrop-filter: var(--reference-home-card-backdrop);');
    expect(dayHomeClockBlock).toContain('border-radius: var(--reference-home-card-radius);');
    expect(dayHomeClockBlock).toContain('padding: 8px;');
    expect(dayHomeClockBlock).toContain('box-shadow: var(--reference-home-card-shadow);');
    expect(dayHomeClockDigitsBlock).toContain('border-radius: 40px;');
    expect(dayHomeClockDigitsBlock).toContain('background: rgba(123, 136, 142, 0.2);');
    expect(dayHomeClockDigitsBlock).toContain('gap: 6px;');
    expect(dayHomeClockSegmentBlock).toContain('fill: rgba(91, 66, 63, 0.04);');
    expect(dayHomeClockActiveSegmentBlock).toContain('fill: rgba(91, 66, 63, 0.9);');
    expect(dayHomeClockActiveSegmentBlock).not.toContain('box-shadow: 0 0 14px');
    expect(dayHomeClockColonBlock).toContain('background: rgba(91, 66, 63, 0.9);');
    expect(dayHomeClockColonBlock).toContain('box-shadow: none;');
    expect(dayHomeNavLinkBlock).toContain('color: rgba(91, 66, 63, 0.68);');
    expect(dayHomeNavActiveBlock).toContain('linear-gradient(to right bottom, #ffffff 60%, rgba(255, 255, 255, 0.4) 100%)');
    expect(dayHomeNavActiveBlock).toContain('color: var(--summer-ink);');
    expect(dayHomeNavActiveBlock).not.toContain('rgba(53, 191, 171, 0.16)');
    expect(homeNavLinksBlock).toContain('display: grid;');
    expect(homeNavLinksBlock).toContain('grid-template-columns: 1fr;');
    expect(homeNavLinksBlock).toContain('width: 100%;');
    expect(homeNavLinkBlock).toContain('font-family: var(--font-nav);');
    expect(homeNavLinkBlock).toContain('font-weight: 400;');
    expect(homeNavLinkBlock).toContain('letter-spacing: 0;');
    expect(homeNavLinkBlock).toContain('line-height: 1.5;');
    expect(homeNavLinkBlock).toContain('min-height: 40px;');
    expect(homeNavLinkBlock).toContain('padding: 0 16px;');
    expect(homeNavBrandBlock).toContain('font-family: var(--font-display);');
    expect(homeNavBrandBlock).toContain('font-weight: 500;');
    expect(homeNavBrandBlock).toContain('line-height: 1;');
    expect(homeNavKickerBlock).toContain('font-family: var(--font-nav);');
    expect(homeNavKickerBlock).toContain('margin: 12px 0 0;');
    expect(homeNavKickerBlock).toContain('text-transform: uppercase;');
    expect(css).toContain('.portfolio-hero__nav-icon');
    expect(css).toContain('--nav-icon-outline');
    expect(css).toContain('--nav-icon-filled');
    expect(css).toContain(".portfolio-hero__nav-links a[data-active='true'] .portfolio-hero__nav-icon::after");
    expect(css).toContain('.portfolio-hero__nav-brand img');
    expect(css).toContain('height: 40px;');
    expect(css).toContain('width: 40px;');
    expect(css).toContain('.portfolio-hero__nav-avatar--day');
    expect(homeNavAvatarDayBlock).toContain('display: none;');
    expect(dayHomeNavAvatarNightBlock).toContain('display: none;');
    expect(dayHomeNavAvatarDayBlock).toContain('display: block;');
    expect(css).toContain('.portfolio-hero__nav-kicker');
    expect(css).toContain(".portfolio-hero__nav-links a[data-active='true']");
    expect(css).toContain('.portfolio-hero__nav-footer');
    expect(css).toContain('.portfolio-hero__nav-theme');
    expect(homeNavFooterBlock).toContain('border-top: 1px solid rgba(148, 163, 184, 0.14);');
    expect(homeNavFooterBlock).toContain('justify-content: space-between;');
    expect(homeNavFooterBlock).toContain('margin-top: 12px;');
    expect(homeNavThemeBlock).toContain('height: 40px;');
    expect(homeNavThemeBlock).toContain('width: 40px;');
    expect(dayHomeNavFooterBlock).toContain('rgba(102, 169, 176, 0.18)');
    expect(dayHomeNavThemeBlock).toContain('rgba(255, 255, 255, 0.86)');
    expect(css).not.toContain('.portfolio-hero__nav-card .theme-toggle');
    expect(css).toContain('.portfolio-hero__nav-links::before');
    expect(css).toContain('.portfolio-hero__nav-links a');
    expect(css).not.toContain('.portfolio-hero__pulse-card');
    expect(css).toContain('.portfolio-hero__sky-card');
    expect(css).toContain('.portfolio-hero__leetcode-card');
    expect(css).toContain('.portfolio-hero__sky-image');
    expect(css).not.toContain('.portfolio-hero__sky-card::after');
    expect(css).toContain('.portfolio-hero__clock-card');
    expect(css).toContain('.portfolio-hero__calendar-card');
    expect(css).not.toContain('.portfolio-hero__recommend-card');
    expect(css).toContain('@keyframes home-widget-enter');
    expect(css).toContain('animation: home-widget-enter');
    expect(homeSkyBlock).not.toContain('grid-area: sky;');
    expect(homeSkyBlock).toContain('overflow: hidden;');
    expect(homeSkyBlock).toContain('padding: 8px;');
    expect(homeSkyBlock).toContain('position: absolute;');
    expect(homeSkyBlock).toContain('left: calc(var(--reference-center-x) - var(--reference-art-width) / 2);');
    expect(homeSkyBlock).toContain('top: calc(var(--reference-center-y) - var(--reference-hi-height) / 2 - var(--reference-art-height) - var(--reference-gap));');
    expect(homeSkyBlock).toContain('height: var(--reference-art-height);');
    expect(homeSkyBlock).toContain('min-height: var(--reference-art-height);');
    expect(homeSkyBlock).toContain('width: var(--reference-art-width);');
    expect(homeSkyImageBlock).toContain('object-fit: cover;');
    expect(homeSkyImageBlock).toContain('width: 100%;');
    expect(homeSkyImageBlock).toContain('height: 100%;');
    expect(homeSkyImageDayBlock).toContain('display: none;');
    expect(homeSkyImageNightBlock).toContain('display: block;');
    expect(daySkyImageDayBlock).toContain('display: block;');
    expect(daySkyImageNightBlock).toContain('display: none;');
    expect(homeClockBlock).not.toContain('grid-area: clock;');
    expect(homeCalendarBlock).not.toContain('grid-area: calendar;');
    expect(homeCalendarBlock).toContain('align-self: start;');
    expect(homeCalendarBlock).toContain('justify-self: start;');
    expect(homeCalendarBlock).toContain('position: absolute;');
    expect(homeCalendarBlock).toContain('left: calc(var(--reference-center-x) + var(--reference-gap) + var(--reference-hi-width) / 2);');
    expect(homeCalendarBlock).toContain('top: calc(var(--reference-center-y) - var(--reference-clock-offset) + var(--reference-gap));');
    expect(homeCalendarBlock).toContain('height: var(--reference-calendar-height);');
    expect(homeCalendarBlock).toContain('width: var(--reference-calendar-width);');
    expect(homeCalendarBlock).toContain('min-height: var(--reference-calendar-height);');
    expect(homeCalendarBlock).toContain('padding: 20px;');
    expect(dayCalendarBlock).toContain('background: var(--reference-home-card-bg);');
    expect(dayCalendarBlock).toContain('backdrop-filter: var(--reference-home-card-backdrop);');
    expect(dayCalendarBlock).toContain('border-color: var(--reference-home-card-border);');
    expect(dayCalendarBlock).toContain('border-radius: var(--reference-home-card-radius);');
    expect(dayCalendarBlock).toContain('box-shadow: var(--reference-home-card-shadow);');
    expect(dayCalendarBlock).toContain('min-height: var(--reference-calendar-height);');
    expect(dayCalendarBlock).toContain('padding: 20px;');
    expect(dayCalendarBlock).toContain('justify-self: start;');
    expect(dayCalendarBlock).toContain('width: var(--reference-calendar-width);');
    expect(css).toContain('.portfolio-hero__calendar-weekday');
    expect(css).toContain("li[data-empty='true']");
    expect(css).toContain('height: 186px;');
    expect(css).toContain('gap: 6px 8px;');
    expect(css).toContain('font-size: 0.875rem;');
    expect(dayCalendarCurrentBlock).toContain('linear-gradient(to right bottom, #2fcbe7 0%, #eec25e)');
    expect(dayCalendarCurrentBlock).toContain('border: 1px solid #ffffff;');
    expect(dayCalendarCurrentBlock).toContain('color: #ffffff;');
    expect(dayCalendarCurrentBlock).toContain('font-weight: 500;');
    expect(homeVisualBlock).toContain('justify-self: start;');
    expect(homeVisualBlock).toContain('position: absolute;');
    expect(homeVisualBlock).toContain('left: calc(var(--reference-center-x) + var(--reference-hi-width) / 2 + var(--reference-gap));');
    expect(homeVisualBlock).toContain('top: calc(var(--reference-center-y) - var(--reference-hi-height) / 2 - var(--reference-art-height) - var(--reference-gap));');
    expect(homeVisualBlock).toContain('width: var(--reference-portrait-width);');
    expect(homeClockBlock).toContain('justify-self: start;');
    expect(homeClockBlock).toContain('position: absolute;');
    expect(homeClockBlock).toContain('left: calc(var(--reference-center-x) + var(--reference-gap) + var(--reference-hi-width) / 2);');
    expect(homeClockBlock).toContain(
      'top: calc(var(--reference-center-y) - var(--reference-clock-offset) - var(--reference-clock-height));',
    );
    expect(homeClockBlock).toContain('height: var(--reference-clock-height);');
    expect(homeClockBlock).toContain('min-height: var(--reference-clock-height);');
    expect(homeClockBlock).toContain('width: var(--reference-clock-width);');
    expect(homeActionsBlock).toContain('position: absolute;');
    expect(homeActionsBlock).toContain('left: calc(var(--reference-center-x) + var(--reference-hi-width) / 2 - var(--reference-social-width));');
    expect(homeActionsBlock).toContain('top: calc(var(--reference-center-y) + var(--reference-hi-height) / 2 + var(--reference-gap));');
    expect(homeActionsBlock).toContain('max-width: var(--reference-social-width);');
    expect(homeActionsBlock).toContain('width: var(--reference-social-width);');
    expect(homeLeetCodeBlock).toContain('animation: home-widget-enter');
    expect(homeLeetCodeBlock).toContain('backdrop-filter: blur(18px) saturate(1.08);');
    expect(homeLeetCodeBlock).toContain('border-radius: 32px;');
    expect(homeLeetCodeBlock).toContain('left: calc(var(--reference-center-x) + var(--reference-gap) + var(--reference-hi-width) / 2 - 162px);');
    expect(homeLeetCodeBlock).toContain('top: calc(var(--reference-center-y) - var(--reference-clock-offset) + var(--reference-gap) + var(--reference-calendar-height) + 62px);');
    expect(homeLeetCodeBlock).toContain('width: var(--reference-leetcode-width);');
    expect(homeLeetCodeIconBlock).toContain('border-radius: 999px;');
    expect(homeLeetCodeIconBlock).toContain('height: 26px;');
    expect(homeLeetCodeIconBlock).toContain('width: 26px;');
    expect(homeLeetCodeMarkBlock).toContain('transform: rotate(-12deg);');
    expect(homeLeetCodeStatusBlock).toContain('display: block;');
    expect(homeLeetCodeStatusBlock).toContain('overflow: hidden;');
    expect(homeLeetCodeStatusBlock).toContain('text-overflow: ellipsis;');
    expect(homeLeetCodeStatusBlock).toContain('white-space: nowrap;');
    expect(homeCalendarBlock).toContain('justify-self: start;');
    expect(css).not.toContain('grid-area: recommend;');
    expect(css).not.toContain('grid-area: pulse;');
    expect(css).not.toContain(":root[data-theme='summer-day'] .portfolio-hero__pulse-card");
    expect(css).not.toContain(".portfolio-hero__nav-links[data-active='moments']::before");
  });

  test('keeps home card navigation clicks responsive while marking module arrivals', () => {
    const css = readGlobalStyles();
    const homeTransitionBlock =
      css.match(/\.portfolio-hero__card-nav\[data-transitioning='true'\]\s*{(?<body>[\s\S]*?)\n}/)?.groups
        ?.body ?? '';
    const transitionNavCardBlock =
      css.match(
        /\.portfolio-hero__card-nav\[data-transitioning='true'\] \.portfolio-hero__nav-card\s*{(?<body>[\s\S]*?)\n}/,
      )?.groups?.body ?? '';
    const pendingLinkBlock =
      css.match(/\.portfolio-hero__nav-links a\[data-pending='true'\]\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ??
      '';
    const navLinkBlock = css.match(/\.portfolio-hero__nav-links a\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const moduleArriveBlock =
      css.match(/\.site-nav-card--from-home\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const homeReturnBlock =
      css.match(/\.portfolio-hero__card-nav--from-module \.portfolio-hero__nav-card\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const reducedMotionBlock =
      css.match(/@media \(prefers-reduced-motion: reduce\) \{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';

    expect(homeTransitionBlock).toContain('pointer-events: none;');
    expect(transitionNavCardBlock).toContain('animation: home-nav-card-press 180ms');
    expect(pendingLinkBlock).toContain('animation: home-nav-pending-press 180ms');
    expect(navLinkBlock).toContain('transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1)');
    expect(moduleArriveBlock).toContain('animation: module-nav-arrive 720ms');
    expect(moduleArriveBlock).toContain('transform-origin: 0 0;');
    expect(moduleArriveBlock).toContain('will-change: opacity, transform;');
    expect(homeReturnBlock).toContain('animation: home-nav-return 720ms');
    expect(homeReturnBlock).toContain('transform-origin: 0 0;');
    expect(homeReturnBlock).toContain('will-change: opacity, transform;');
    expect(css).toContain('@keyframes home-nav-card-press');
    expect(css).toContain('@keyframes home-nav-pending-press');
    expect(css).toContain('@keyframes home-nav-return');
    expect(css).toContain('translate3d(var(--home-nav-return-x, -18px), var(--home-nav-return-y, -22px), 0)');
    expect(css).toContain('scale(var(--home-nav-return-scale-x, 1.04), var(--home-nav-return-scale-y, 0.94))');
    expect(css).not.toContain('@keyframes home-card-nav-exit');
    expect(css).not.toContain('@keyframes home-nav-card-compress');
    expect(css).not.toContain('@keyframes home-nav-pending-pulse');
    expect(css).toContain('@keyframes module-nav-arrive');
    expect(css).toContain('translate3d(var(--nav-arrive-x, 18px), var(--nav-arrive-y, 22px), 0)');
    expect(css).toContain('scale(var(--nav-arrive-scale-x, 0.94), var(--nav-arrive-scale-y, 0.94))');
    expect(css).toContain('@keyframes module-nav-focus');
    expect(reducedMotionBlock).not.toContain('.site-nav-card--from-home');
    expect(reducedMotionBlock).not.toContain('.portfolio-hero__card-nav[data-transitioning=\'true\']');
  });

  test('uses reference-style social buttons on the portfolio home page', () => {
    const css = readGlobalStyles();
    const actionsBlock = css.match(/\.portfolio-hero__actions\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const actionRowBlock = css.match(/\.portfolio-hero__action-row\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const secondaryActionRowBlock =
      css.match(/\.portfolio-hero__action-row--secondary\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const socialBlock = css.match(/\.portfolio-hero__social\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const githubBlock = css.match(/\.portfolio-hero__social--github\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const juejinBlock = css.match(/\.portfolio-hero__social--juejin\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const guestbookBlock =
      css.match(/\.portfolio-hero__social--guestbook\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const adminWidgetBlock =
      css.match(/\.portfolio-hero__admin-widget\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const adminGridIconBlock =
      css.match(/\.portfolio-hero__admin-grid-icon\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const responsiveAdminWidgetBlock = readMediaRule(css, '(max-width: 820px)', '.portfolio-hero__admin-widget');
    const adminWidgetHoverBlock =
      css.match(/\.portfolio-hero__admin-widget:hover,[\s\S]*?\.portfolio-hero__admin-widget:focus-visible\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const dayAdminWidgetBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero__admin-widget\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const emailIconBlock =
      css.match(/\.portfolio-hero__social-icon--email\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const dayGithubBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero__social--github\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const dayJuejinBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero__social--juejin\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const dayGuestbookBlock =
      css.match(/:root\[data-theme='summer-day'\] \.portfolio-hero__social--guestbook\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const nightJuejinBlock =
      css.match(/:root\[data-theme='summer-night'\] \.portfolio-hero__social--juejin\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const nightJuejinAfterBlock =
      css.match(
        /:root\[data-theme='summer-night'\] \.portfolio-hero__social--juejin::after\s*{(?<body>[\s\S]*?)\n}/,
      )?.groups?.body ?? '';
    const nightGuestbookBlock =
      css.match(/:root\[data-theme='summer-night'\] \.portfolio-hero__social--guestbook\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const nightGuestbookHoverBlock =
      css.match(
        /:root\[data-theme='summer-night'\] \.portfolio-hero__social--guestbook:hover\s*{(?<body>[\s\S]*?)\n}/,
      )?.groups?.body ?? '';
    const nightGuestbookAfterBlock =
      css.match(
        /:root\[data-theme='summer-night'\] \.portfolio-hero__social--guestbook::after\s*{(?<body>[\s\S]*?)\n}/,
      )?.groups?.body ?? '';

    expect(actionsBlock).toContain('align-items: center;');
    expect(actionsBlock).toContain('align-self: start;');
    expect(actionsBlock).toContain('flex-direction: column;');
    expect(actionsBlock).toContain('gap: 18px;');
    expect(actionsBlock).toContain('justify-content: center;');
    expect(actionsBlock).toContain('margin-top: 0;');
    expect(actionsBlock).toContain('max-width: var(--reference-social-width);');
    expect(actionsBlock).toContain('width: var(--reference-social-width);');
    expect(actionsBlock).not.toContain('border-top');
    expect(actionRowBlock).toContain('display: flex;');
    expect(actionRowBlock).toContain('flex-wrap: wrap;');
    expect(actionRowBlock).toContain('gap: 12px;');
    expect(actionRowBlock).toContain('justify-content: center;');
    expect(secondaryActionRowBlock).toContain('gap: 10px;');
    expect(socialBlock).toContain('gap: 8px;');
    expect(socialBlock).toContain('min-height: auto;');
    expect(socialBlock).toContain('overflow: hidden;');
    expect(socialBlock).toContain('padding: 10px 12px;');
    expect(socialBlock).toContain('text-decoration: none;');
    expect(css).toContain('.portfolio-hero__social::before');
    expect(css).toContain('.portfolio-hero__social span');
    expect(githubBlock).toContain('background: #070707;');
    expect(githubBlock).toContain('border-radius: 12px;');
    expect(githubBlock).toContain('box-shadow: inset 0 0 12px rgba(255, 255, 255, 0.4);');
    expect(githubBlock).toContain('color: #ffffff;');
    expect(githubBlock).toContain('font-family: "Averia Gruesa Libre", sans-serif !important;');
    expect(githubBlock).toContain('font-size: 1.25rem;');
    expect(githubBlock).toContain('padding: 6px 12px;');
    expect(juejinBlock).toContain('backdrop-filter: blur(4px);');
    expect(juejinBlock).toContain('background: rgba(255, 255, 255, 0.86);');
    expect(juejinBlock).toContain('border-radius: 12px;');
    expect(juejinBlock).toContain('0 26px 46px -30px rgba(255, 255, 255, 0.24)');
    expect(juejinBlock).toContain('color: #173f45;');
    expect(guestbookBlock).toContain('border-radius: 12px;');
    expect(guestbookBlock).toContain('--color-brand: #2fcbe7;');
    expect(guestbookBlock).toContain('--color-border: #ffffff;');
    expect(guestbookBlock).toContain('color: #55c7df;');
    expect(guestbookBlock).toContain('height: 46px;');
    expect(guestbookBlock).toContain('overflow: visible;');
    expect(guestbookBlock).toContain('transform-origin: center;');
    expect(guestbookBlock).toContain('width: 46px;');
    expect(guestbookBlock).toContain('padding: 0;');
    expect(adminWidgetBlock).toContain('height: 40px;');
    expect(adminWidgetBlock).toContain('background: transparent;');
    expect(adminWidgetBlock).toContain('border: 0;');
    expect(adminWidgetBlock).toContain('box-shadow: none;');
    expect(adminWidgetBlock).toContain(
      'left: calc(var(--reference-center-x) + var(--reference-gap) + var(--reference-hi-width) / 2 + var(--reference-clock-width) / 2 - 20px);',
    );
    expect(adminWidgetBlock).toContain('position: absolute;');
    expect(adminWidgetBlock).toContain(
      'top: calc(var(--reference-center-y) - var(--reference-clock-offset) - var(--reference-clock-height) - 56px);',
    );
    expect(adminWidgetBlock).toContain('width: 40px;');
    expect(adminWidgetBlock).toContain('padding: 8px;');
    expect(adminWidgetBlock).toContain('color: rgba(226, 232, 240, 0.58);');
    expect(adminWidgetBlock).toContain('text-decoration: none;');
    expect(adminGridIconBlock).toContain('display: block;');
    expect(adminGridIconBlock).toContain('height: 24px;');
    expect(adminGridIconBlock).toContain('width: 24px;');
    expect(responsiveAdminWidgetBlock).toContain('height: 40px;');
    expect(responsiveAdminWidgetBlock).toContain('left: auto;');
    expect(responsiveAdminWidgetBlock).toContain('position: static;');
    expect(responsiveAdminWidgetBlock).toContain('top: auto;');
    expect(responsiveAdminWidgetBlock).toContain('width: 40px;');
    expect(adminWidgetHoverBlock).toContain('opacity: 0.8;');
    expect(adminWidgetHoverBlock).toContain('outline: none;');
    expect(dayAdminWidgetBlock).toContain('background: transparent;');
    expect(dayAdminWidgetBlock).toContain('box-shadow: none;');
    expect(dayAdminWidgetBlock).toContain('color: rgba(91, 66, 63, 0.72);');
    expect(css).toContain(".portfolio-hero__admin-widget[aria-expanded='true']");
    expect(css).toContain('.home-admin-config');
    expect(css).toContain('.home-admin-config__panel');
    expect(css).toContain('width: 100vw;');
    expect(css).toContain('width: 720px;');
    expect(css).toContain('max-width: calc(100vw - 36px);');
    expect(css).toContain('.home-admin-config__tabs');
    expect(css).toContain('.home-admin-config__grid');
    expect(css).toContain('.home-admin-config__layout-row');
    expect(css).toContain('.portfolio-hero__social--guestbook::after');
    expect(css).toContain("background: radial-gradient(circle, rgba(47, 203, 231, 0.24) 0%, rgba(47, 203, 231, 0.12) 48%, transparent 70%);");
    expect(css).toContain('transform: scale(1.05);');
    expect(css).toContain(".portfolio-hero__social--guestbook[data-clicked='true']");
    expect(css).toContain('transform: scale(0.95);');
    expect(css).toContain(".portfolio-hero__social--guestbook[data-clicked='true']::after");
    expect(css).toContain('animation: contact-button-pop 420ms ease-out both;');
    expect(css).toContain('@keyframes contact-button-pop');
    expect(css).toContain('.portfolio-hero__social-icon--email');
    expect(emailIconBlock).toContain('height: 32px;');
    expect(emailIconBlock).toContain('width: 32px;');
    expect(css).toContain('.portfolio-hero__social--github .portfolio-hero__social-icon');
    expect(css).toContain('.portfolio-hero__social-icon--juejin');
    expect(css).toContain(":root[data-theme='summer-night'] .portfolio-hero__nav-brand small");
    expect(nightJuejinBlock).toContain('background-color: rgba(5, 12, 22, 0.78) !important;');
    expect(nightJuejinBlock).toContain('background-image: linear-gradient(180deg, rgba(34, 211, 238, 0.14), rgba(15, 23, 42, 0.08)) !important;');
    expect(nightJuejinBlock).toContain('border-color: rgba(34, 211, 238, 0.34) !important;');
    expect(nightJuejinBlock).toContain('color: #d7faff !important;');
    expect(nightJuejinBlock).not.toContain('background: rgba(255, 255, 255, 0.86);');
    expect(nightJuejinAfterBlock).toContain('rgba(5, 12, 22, 0.86)');
    expect(nightJuejinAfterBlock).toContain('box-shadow: inset 0 0 0 1px rgba(34, 211, 238, 0.28);');
    expect(nightJuejinAfterBlock).toContain('z-index: 0;');
    expect(nightGuestbookBlock).toContain('--color-brand: #56dff5;');
    expect(nightGuestbookBlock).toContain('--color-border: rgba(215, 250, 255, 0.94);');
    expect(nightGuestbookBlock).toContain('background-color: rgba(5, 12, 22, 0.8) !important;');
    expect(nightGuestbookBlock).toContain('border-color: rgba(34, 211, 238, 0.34) !important;');
    expect(nightGuestbookBlock).toContain('color: #d7faff !important;');
    expect(nightGuestbookBlock).not.toContain('background: rgba(255, 255, 255, 0.86);');
    expect(nightGuestbookHoverBlock).toContain('background-color: rgba(7, 18, 30, 0.9) !important;');
    expect(nightGuestbookAfterBlock).toContain('rgba(86, 223, 245, 0.26)');
    expect(nightGuestbookAfterBlock).toContain('border-color: rgba(34, 211, 238, 0.42);');
    expect(dayGithubBlock).toContain('background: #070707;');
    expect(dayJuejinBlock).toContain('background: var(--reference-home-card-bg);');
    expect(dayJuejinBlock).toContain('box-shadow: var(--reference-home-card-shadow);');
    expect(dayJuejinBlock).toContain('color: var(--summer-ink);');
    expect(dayGuestbookBlock).toContain('background: var(--reference-home-card-bg);');
    expect(dayGuestbookBlock).toContain('box-shadow: var(--reference-home-card-shadow);');
    expect(dayGuestbookBlock).toContain('color: #55c7df;');
  });

  test('uses the same compact card navigation on public reader routes', () => {
    const css = readGlobalStyles();
    const readerHeaderBlock =
      css.match(/body:has\(\.page-main\) \.site-header\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const readerNavBlock =
      css.match(/body:has\(\.page-main\) \.site-nav\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const readerNavHoverBlock =
      css.match(
        /body:has\(\.page-main\) \.site-nav a:hover,[\s\S]*?body:has\(\.page-main\) \.site-nav a:focus-visible\s*{(?<body>[\s\S]*?)\n}/,
      )?.groups?.body ?? '';

    expect(readerHeaderBlock).toContain('margin-left: clamp(16px, 3vw, 32px);');
    expect(readerHeaderBlock).not.toContain('width: 100%;');
    expect(readerHeaderBlock).not.toContain('border-radius: 0;');
    expect(readerNavBlock).toContain('justify-content: flex-start;');
    expect(readerNavHoverBlock).toContain('background: transparent;');
    expect(css).toContain('.brand-avatar');
    expect(css).toContain('.site-nav__label');
    expect(css).toContain(".site-nav a[aria-current='page']");
  });

  test('keeps the portfolio home card navigation usable on mobile', () => {
    const responsiveCss = readStylesheet('src/app/styles/responsive.css');
    const mobileResponsiveCss = responsiveCss.slice(
      responsiveCss.indexOf('@media (max-width: 820px) {'),
      responsiveCss.indexOf('@media (max-width: 1160px) and (min-width: 821px) {'),
    );
    const mobileHomeNavBlock =
      responsiveCss.match(/\.portfolio-hero__card-nav\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';
    const mobileHomeNavCardBlock =
      responsiveCss.match(/\.portfolio-hero__nav-card\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';
    const mobileNavBrandTextBlock =
      responsiveCss.match(/\.portfolio-hero__nav-brand span\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';
    const mobileNavKickerBlock =
      responsiveCss.match(/\.portfolio-hero__nav-kicker\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';
    const mobileNavLinksBlock =
      responsiveCss.match(/\.portfolio-hero__nav-links\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';
    const mobileNavLinkBlock =
      responsiveCss.match(/\.portfolio-hero__nav-links a\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';
    const mobileNavFooterBlock =
      responsiveCss.match(/\.portfolio-hero__nav-footer\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';
    const mobileNavFooterTextBlock =
      responsiveCss.match(/\.portfolio-hero__nav-footer span\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';
    const mobileHeroContentBlock =
      responsiveCss.match(/\.portfolio-hero__content\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';
    const mobileLeftStackBlock =
      responsiveCss.match(/\.portfolio-hero__left-stack\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';
    const mobileCenterStackBlock =
      responsiveCss.match(/\.portfolio-hero__center-stack\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';
    const mobileLatestCardBlock =
      responsiveCss.match(/\.portfolio-hero__latest-card\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';
    const mobileLeetCodeCardBlock =
      responsiveCss.match(/\.portfolio-hero__leetcode-card\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';
    const mobileLatestCardLinkBlock =
      responsiveCss.match(/\.portfolio-hero__latest-card a\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';
    const mobileLatestCoverBlock =
      responsiveCss.match(/\.portfolio-hero__latest-card img,[\s\S]*?\.portfolio-hero__latest-cover\s*{(?<body>[\s\S]*?)\n  }/)
        ?.groups?.body ?? '';
    const mobileIntroCardBlock =
      [...responsiveCss.matchAll(/\.portfolio-hero__intro-card\s*{(?<body>[\s\S]*?)\n  }/g)].at(-1)?.groups
        ?.body ?? '';
    const mobileActionsBlock =
      responsiveCss.match(/\.portfolio-hero__actions\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';
    const mobileSkyCardBlock =
      [...responsiveCss.matchAll(/\.portfolio-hero__sky-card\s*{(?<body>[\s\S]*?)\n  }/g)].at(-1)?.groups
        ?.body ?? '';
    const mobileHiddenClockCalendarBlock =
      [
        ...mobileResponsiveCss.matchAll(
          /\.portfolio-hero__clock-card,[\s\S]*?\.portfolio-hero__calendar-card\s*{(?<body>[\s\S]*?)\n  }/g,
        ),
      ].at(-1)
        ?.groups?.body ?? '';
    const mobileHiddenSkyClockCalendarBlock =
      [
        ...mobileResponsiveCss.matchAll(
          /\.portfolio-hero__sky-card,[\s\S]*?\.portfolio-hero__calendar-card\s*{(?<body>[\s\S]*?)\n  }/g,
        ),
      ].at(-1)
        ?.groups?.body ?? '';
    const mobileBackToTopBlock =
      responsiveCss.match(/\.mobile-back-to-top\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';
    const mobileBackToTopVisibleBlock =
      responsiveCss.match(/\.mobile-back-to-top\[data-visible='true'\]\s*{(?<body>[\s\S]*?)\n  }/)?.groups
        ?.body ?? '';
    const dayMobileBackToTopBlock =
      responsiveCss.match(/:root\[data-theme='summer-day'\] \.mobile-back-to-top\s*{(?<body>[\s\S]*?)\n  }/)
        ?.groups?.body ?? '';
    const mobileLikeRowBlock =
      responsiveCss.match(/\.portfolio-hero__like-row\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';
    expect(responsiveCss).toContain('.portfolio-hero__card-nav');
    expect(responsiveCss).toContain('.portfolio-hero__visual');
    expect(responsiveCss).not.toContain('.portfolio-hero__status-card');
    expect(responsiveCss).not.toContain('.portfolio-hero__pulse-card');
    expect(mobileHeroContentBlock).toContain('grid-template-areas:');
    expect(mobileHeroContentBlock).toContain('"nav"');
    expect(mobileHeroContentBlock).toContain('"intro"');
    expect(mobileHeroContentBlock).toContain('"recommendation"');
    expect(mobileHeroContentBlock).toContain('"latest"');
    expect(mobileHeroContentBlock).toContain('"actions"');
    expect(mobileHeroContentBlock).toMatch(/"intro"\s*"recommendation"\s*"latest"\s*"actions"/);
    expect(mobileHeroContentBlock).not.toContain('"sky"');
    expect(mobileHeroContentBlock).not.toContain('"clock"');
    expect(mobileHeroContentBlock).not.toContain('"calendar"');
    expect(mobileLeftStackBlock).toContain('display: contents;');
    expect(mobileCenterStackBlock).toContain('display: contents;');
    expect(mobileHomeNavBlock).toContain('max-width: 100%;');
    expect(mobileHomeNavBlock).toContain('grid-area: nav;');
    expect(mobileHomeNavBlock).toContain('justify-self: center;');
    expect(mobileHomeNavBlock).toContain('translate: none;');
    expect(mobileHomeNavBlock).toContain('width: min(340px, 100%);');
    expect(mobileHomeNavCardBlock).toContain('align-items: center;');
    expect(mobileHomeNavCardBlock).toContain('border-radius: 999px;');
    expect(mobileHomeNavCardBlock).toContain('display: flex;');
    expect(mobileHomeNavCardBlock).toContain('height: 64px;');
    expect(mobileHomeNavCardBlock).toContain('padding: 8px;');
    expect(mobileNavBrandTextBlock).toContain('display: none;');
    expect(mobileNavKickerBlock).toContain('display: none;');
    expect(mobileNavLinksBlock).toContain('display: flex;');
    expect(mobileNavLinksBlock).toContain('gap: 2px;');
    expect(mobileNavLinkBlock).toContain('font-size: 0;');
    expect(mobileNavLinkBlock).toContain('height: 44px;');
    expect(mobileNavLinkBlock).toContain('width: 44px;');
    expect(mobileNavFooterBlock).toContain('border-top: 0;');
    expect(mobileNavFooterBlock).toContain('margin-left: auto;');
    expect(mobileNavFooterTextBlock).toContain('display: none;');
    expect(mobileIntroCardBlock).toContain('grid-area: intro;');
    expect(mobileIntroCardBlock).toContain('translate: none;');
    expect(mobileActionsBlock).toContain('grid-area: actions;');
    expect(mobileActionsBlock).toContain('margin-top: 0;');
    expect(mobileLatestCardBlock).toContain('grid-area: latest;');
    expect(mobileLatestCardBlock).toContain('justify-self: center;');
    expect(mobileLatestCardBlock).toContain('margin-right: 0;');
    expect(mobileLatestCardBlock).toContain('padding: 12px 14px;');
    expect(mobileLatestCardBlock).toContain('translate: none;');
    expect(mobileLatestCardBlock).toContain('width: min(340px, 100%);');
    expect(mobileLeetCodeCardBlock).toContain('grid-area: recommendation;');
    expect(mobileLeetCodeCardBlock).toContain('justify-self: center;');
    expect(mobileLeetCodeCardBlock).toContain('padding: 14px;');
    expect(mobileLeetCodeCardBlock).toContain('translate: none;');
    expect(mobileLeetCodeCardBlock).toContain('width: min(300px, 100%);');
    expect(mobileLatestCardLinkBlock).toContain('grid-template-columns: 44px minmax(0, 1fr);');
    expect(mobileLatestCoverBlock).toContain('width: 44px;');
    expect(mobileSkyCardBlock).not.toContain('grid-area: sky;');
    expect(mobileHiddenSkyClockCalendarBlock).toContain('display: none;');
    expect(mobileHiddenClockCalendarBlock).toContain('display: none;');
    expect(mobileBackToTopBlock).toContain('display: inline-flex;');
    expect(mobileBackToTopBlock).toContain('position: fixed;');
    expect(mobileBackToTopBlock).toContain('right: 18px;');
    expect(mobileBackToTopBlock).toContain('bottom: 18px;');
    expect(mobileBackToTopBlock).toContain('height: 44px;');
    expect(mobileBackToTopBlock).toContain('width: 44px;');
    expect(mobileBackToTopBlock).toContain('transform: translate3d(0, 14px, 0) scale(0.92);');
    expect(mobileBackToTopBlock).toContain('opacity: 0;');
    expect(mobileBackToTopBlock).toContain('visibility: hidden;');
    expect(mobileBackToTopBlock).toContain('transition: opacity 180ms ease, transform 180ms ease, visibility 180ms ease;');
    expect(mobileBackToTopVisibleBlock).toContain('opacity: 1;');
    expect(mobileBackToTopVisibleBlock).toContain('transform: translate3d(0, 0, 0) scale(1);');
    expect(mobileBackToTopVisibleBlock).toContain('visibility: visible;');
    expect(responsiveCss).not.toContain('.mobile-back-to-top__icon');
    expect(responsiveCss).not.toContain('reference-nav/back-to-top.svg');
    expect(dayMobileBackToTopBlock).toContain('position: fixed;');
    expect(dayMobileBackToTopBlock).toContain('z-index: 40;');
    expect(responsiveCss.replace(/\r\n/g, '\n')).toContain(
      'body:has(.portfolio-home) .portfolio-hero__card-nav,\n  body:has(.portfolio-home) .portfolio-hero__latest-card,\n  body:has(.portfolio-home) .portfolio-hero__leetcode-card {\n    translate: none;\n  }',
    );
    expect(mobileLikeRowBlock).toContain('grid-area: auto;');
    expect(mobileLikeRowBlock).toContain('translate: none;');
    expect(responsiveCss).toContain('translate: none;');
    expect(responsiveCss).toContain('.portfolio-hero__nav-links a');
    expect(mobileNavLinksBlock).toContain('grid-template-columns: none;');
    expect(responsiveCss).not.toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
  });

  test('keeps public reader route navigation in the reference icon capsule on mobile', () => {
    const responsiveCss = readStylesheet('src/app/styles/responsive.css');
    const mobileReaderHeaderBlock =
      responsiveCss.match(/body:has\(\.page-main\) \.site-header\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';

    expect(mobileReaderHeaderBlock).toContain('width: 388px;');
    expect(mobileReaderHeaderBlock).toContain('padding: 12px;');
    expect(mobileReaderHeaderBlock).not.toContain('grid-template-columns: 1fr;');
    expect(responsiveCss).toContain('--nav-item-size: 28px;');
    expect(responsiveCss).toContain('--nav-item-gap: 24px;');
  });

  test('keeps the guestbook page inside the cyber glass visual system', () => {
    const css = readGlobalStyles();

    expect(css).toContain('.guestbook-page');
    expect(css).toContain('.guestbook-copy-card');
    expect(css).toContain('.guestbook-panel');
    expect(css).toContain('.guestbook-page .guestbook-form');
    expect(css).toContain('.guestbook-page .guestbook-form button');
  });

  test('keeps the disabled guestbook page readable in the summer day theme', () => {
    const css = readGlobalStyles();
    const dayGuestbookCardBlock =
      css.match(/:root\[data-theme='summer-day'\] \.guestbook-page \.guestbook-copy-card,[\s\S]*?\.guestbook-panel\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';

    expect(css).toContain(":root[data-theme='summer-day'] .guestbook-page .guestbook-copy-card");
    expect(css).toContain(":root[data-theme='summer-day'] .guestbook-page .page-title h1");
    expect(css).toContain(":root[data-theme='summer-day'] .guestbook-disabled-actions a");
    expect(dayGuestbookCardBlock).toContain('var(--summer-panel)');
    expect(dayGuestbookCardBlock).toContain('var(--summer-panel-sheen)');
    expect(dayGuestbookCardBlock).toContain('var(--summer-glint)');
    expect(dayGuestbookCardBlock).not.toContain('var(--cyber-panel)');
  });

  test('keeps the search page form inside the cyber glass visual system', () => {
    const css = readGlobalStyles();

    expect(css).toContain('.search-page .search-form');
    expect(css).toContain('background: rgba(4, 6, 14, 0.62);');
    expect(css).toContain('.search-page .search-form input');
    expect(css).toContain('.search-page .search-summary');
    expect(css).toContain('.search-scope-tabs');
    expect(css).toContain('.search-result-list');
    expect(css).toContain('.search-result-snippet mark');
    expect(css).toContain('.search-hit-field');
  });

  test('keeps public list pages inside the cyber glass visual system', () => {
    const css = readGlobalStyles();
    const publicBodyBlock =
      css.match(/body:has\(\.portfolio-home\),[\s\S]*?body:has\(\.page-main\)\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const homeBlock = css.match(/\.portfolio-home,[\s\S]*?\.portfolio-about-panel\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const siteShellBlock = css.match(/\.site-shell\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const siteShellCanvasBlock = css.match(/\.site-shell__canvas\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const persistentBackgroundBlock = css.match(/\.persistent-public-background\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const pageMainBlock =
      [...css.matchAll(/\.page-main\s*{(?<body>[\s\S]*?)\n}/g)]
        .map((match) => match.groups?.body ?? '')
        .find((block) => block.includes('rgba(2, 4, 11, 0.74)')) ?? '';
    const pageMainBeforeBlock = css.match(/\.page-main::before\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const pageMainAfterBlock =
      [...css.matchAll(/\.page-main::after\s*{(?<body>[\s\S]*?)\n}/g)]
        .map((match) => match.groups?.body ?? '')
        .find((block) => block.includes('background: transparent;')) ?? '';
    const contentCardTitleLinkBlock = css.match(/\.page-main \.content-card h3 a\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const contentCardSeriesBlock =
      css.match(/\.page-main \.content-card__series\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const contentCardSeriesLinkBlock =
      css.match(/\.page-main \.content-card__series a\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const searchTitleLinkBlock = css.match(/\.search-result-card h2 a\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';

    expect(css).toContain('--public-home-background:');
    expect(css).toContain('--public-home-star-field:');
    expect(css).toContain('--public-night-sparkles:');
    expect(publicBodyBlock).not.toContain('rgba(251, 191, 36');
    expect(publicBodyBlock).toContain('background: #02040b;');
    expect(homeBlock).toContain('background: #02040b;');
    expect(siteShellBlock).toContain('position: relative;');
    expect(siteShellCanvasBlock).toContain('position: fixed;');
    expect(siteShellCanvasBlock).toContain('height: 100vh;');
    expect(siteShellCanvasBlock).toContain('width: 100vw;');
    expect(siteShellCanvasBlock).toContain('pointer-events: none;');
    expect(persistentBackgroundBlock).toContain('position: fixed;');
    expect(persistentBackgroundBlock).toContain('z-index: 0;');
    expect(pageMainBlock).toContain('rgba(2, 4, 11, 0.74)');
    expect(pageMainBlock).toContain('isolation: isolate;');
    expect(css).toContain('.page-main::before');
    expect(css).toContain('.page-main::after');
    expect(css).toContain('.page-main > *');
    expect(pageMainBeforeBlock).toContain('var(--public-home-star-field)');
    expect(pageMainBeforeBlock).toContain('var(--public-night-sparkles)');
    expect(pageMainBeforeBlock).toContain('animation: none;');
    expect(pageMainAfterBlock).toContain('animation: none;');
    expect(pageMainAfterBlock).toContain('background: transparent;');
    expect(pageMainAfterBlock).toContain('filter: none;');
    expect(pageMainAfterBlock).not.toContain('linear-gradient(112deg');
    expect(css).toContain('@keyframes night-star-twinkle');
    expect(css).toContain('@keyframes night-meteor-shower');
    expect(css).toContain('.page-main::after');
    expect(css).toContain('.page-main .content-card');
    expect(css).toContain('.page-main .category-section__heading');
    expect(css).toContain('.page-main .archive-list');
    expect(css).toContain('.page-main .content-card__series a');
    expect(contentCardTitleLinkBlock).toContain('min-height: 40px;');
    expect(contentCardTitleLinkBlock).toContain('display: inline-flex;');
    expect(contentCardSeriesBlock).toContain('align-self: start;');
    expect(contentCardSeriesBlock).toContain('justify-content: flex-start;');
    expect(contentCardSeriesLinkBlock).toContain('min-height: 28px;');
    expect(contentCardSeriesLinkBlock).toContain('padding: 0 11px;');
    expect(contentCardSeriesLinkBlock).toContain('width: fit-content;');
    expect(contentCardSeriesLinkBlock).not.toContain('min-height: 40px;');
    expect(searchTitleLinkBlock).toContain('min-height: 40px;');
    expect(searchTitleLinkBlock).toContain('display: inline-flex;');
    expect(css).toContain('.page-main .content-card h3 a:focus-visible');
    expect(css).toContain('.search-result-card h2 a:focus-visible');
  });

  test('keeps the public about page inside the cyber glass visual system', () => {
    const css = readGlobalStyles();
    const aboutNoteBlock = css.match(/\.about-note\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const aboutNoteListBlock = css.match(/\.about-note__list\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const aboutNoteItemBlock = css.match(/\.about-note__item\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const aboutNoteItemIconBlock =
      css.match(/\.about-note__item-icon\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const aboutNoteItemCopyBlock =
      css.match(/\.about-note__item p\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const aboutStackBlock = css.match(/\.about-stack\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const aboutStackItemBlock = css.match(/\.about-stack li\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const aboutStackIconBlock = css.match(/\.about-stack__icon\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const dayAboutSocialBlock =
      css.match(/:root\[data-theme='summer-day'\] \.about-social a\s*{(?<body>[\s\S]*?)\n}/)?.groups
        ?.body ?? '';
    const dayAboutNoteBlock =
      css.match(/:root\[data-theme='summer-day'\] \.about-note\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ??
      '';
    const dayAboutCopyBlock =
      css.match(/:root\[data-theme='summer-day'\] \.about-note p\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ??
      '';

    expect(css).toContain('.about-note');
    expect(aboutNoteBlock).toContain('background: rgba(15, 23, 42, 0.42);');
    expect(aboutNoteBlock).toContain('border: 1px solid rgba(148, 163, 184, 0.16);');
    expect(aboutNoteBlock).not.toContain('background: #fff;');
    expect(aboutNoteListBlock).toContain('list-style: none;');
    expect(aboutNoteItemBlock).toContain('display: grid;');
    expect(aboutNoteItemBlock).toContain('grid-template-columns: auto minmax(0, 1fr);');
    expect(aboutNoteItemIconBlock).toContain('border-radius: 999px;');
    expect(aboutNoteItemCopyBlock).toContain('color: rgba(226, 232, 240, 0.66);');
    expect(aboutStackBlock).toContain('display: flex;');
    expect(aboutStackBlock).toContain('flex-wrap: wrap;');
    expect(aboutStackItemBlock).toContain('display: inline-flex;');
    expect(aboutStackItemBlock).toContain('border-radius: 999px;');
    expect(aboutStackIconBlock).toContain('flex: 0 0 auto;');
    expect(dayAboutSocialBlock).toContain('color: var(--summer-accent);');
    expect(dayAboutSocialBlock).toContain('border-color: rgba(45, 109, 116, 0.18);');
    expect(dayAboutNoteBlock).toContain('var(--summer-panel-sheen)');
    expect(dayAboutNoteBlock).toContain('var(--summer-panel)');
    expect(dayAboutNoteBlock).toContain('border-color: var(--summer-line);');
    expect(dayAboutNoteBlock).toContain('color: var(--summer-ink);');
    expect(dayAboutNoteBlock).not.toContain('rgba(4, 6, 14, 0.46)');
    expect(dayAboutCopyBlock).toContain('color: var(--summer-muted);');
  });

  test('keeps public article detail surfaces inside the cyber glass visual system', () => {
    const css = readGlobalStyles();
    const narrowBlock = css.match(/\.narrow\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const detailNarrowBlock = css.match(/\.page-main\.narrow:has\(\.detail\)\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const detailBlock = css.match(/\.detail\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const detailBodyBlock = css.match(/\.detail \.detail__body\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const detailBodyImageBlock = css.match(/\.detail \.detail__body img\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const detailBodyHeadingPrefixBlock =
      css.match(/\.detail \.detail__body h1::before,[\s\S]*?\.detail \.detail__body h3::before\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const detailBodyH3PrefixBlock =
      [...css.matchAll(/\.detail \.detail__body h3::before\s*{(?<body>[\s\S]*?)\n}/g)].at(-1)?.groups?.body ??
      '';
    const detailSidebarBlock = css.match(/^\.detail-sidebar\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const detailSidebarCardBlock =
      css.match(/\.detail-sidebar__card\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const detailSidebarCoverImageBlock =
      css.match(/\.detail-sidebar__cover img\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const detailShellDesktopBlock =
      css.match(/\.detail-shell--with-toc\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';
    const detailShellTocDesktopBlock =
      css.match(/\.detail-shell--with-toc \.detail-sidebar\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';
    const detailShellBlock = css.match(/^\.detail-shell\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const detailTocBlock = css.match(/^\.detail-toc\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const detailTocLinkBlock = css.match(/^\.detail-toc a\s*{(?<body>[\s\S]*?)\n}/m)?.groups?.body ?? '';
    const commentEmptyBlock = css.match(/\.detail-comments__list li,[\s\S]*?\.detail-comments__empty\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const adjacentBlock = css.match(/\.adjacent-content a,[\s\S]*?\.adjacent-content__empty\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const detailLikeButtonBlock = css.match(/\.detail__meta \.like-button\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const detailTaxonomyLinkBlock = css.match(/\.page-main \.detail-taxonomy a\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';

    expect(narrowBlock).toContain('margin-inline: auto;');
    expect(narrowBlock).toContain('width: min(100%, 820px);');
    expect(detailNarrowBlock).toContain('max-width: 1140px;');
    expect(detailNarrowBlock).toContain('padding-top: clamp(108px, 12vw, 140px);');
    expect(detailNarrowBlock).toContain('width: min(100%, 1140px);');
    expect(detailBlock).toContain('rgba(4, 6, 14, 0.62)');
    expect(detailBlock).toContain('backdrop-filter: blur(18px) saturate(1.08);');
    expect(detailBlock).toContain('border-radius: 24px;');
    expect(detailBlock).toContain('max-width: 888px;');
    expect(detailBodyBlock).toContain('background: transparent;');
    expect(detailBodyBlock).toContain('border: 0;');
    expect(detailBodyBlock).toContain('font-size: 15px;');
    expect(detailBodyBlock).toContain('letter-spacing: 0.03em;');
    expect(detailBodyHeadingPrefixBlock).toContain("content: '# ';");
    expect(detailBodyHeadingPrefixBlock).toContain('color: rgba(103, 232, 249, 0.58);');
    expect(detailBodyH3PrefixBlock).toContain("content: '## ';");
    expect(detailSidebarBlock).toContain('width: 200px;');
    expect(detailSidebarBlock).toContain('display: grid;');
    expect(detailSidebarCardBlock).toContain('border-radius: 12px;');
    expect(detailSidebarCardBlock).toContain('background: rgba(3, 9, 20, 0.68);');
    expect(detailSidebarCoverImageBlock).toContain('width: 100%;');
    expect(detailSidebarCoverImageBlock).toContain('border-radius: 12px;');
    expect(css).toContain('.detail-shell');
    expect(detailShellBlock).toContain('display: block;');
    expect(detailShellBlock).toContain('position: relative;');
    expect(css).toContain('@media (min-width: 1280px)');
    expect(detailShellDesktopBlock).toContain('display: flex;');
    expect(detailShellDesktopBlock).toContain('justify-content: center;');
    expect(detailShellDesktopBlock).not.toContain('grid-template-columns');
    expect(detailShellTocDesktopBlock).toContain('order: 2;');
    expect(detailShellTocDesktopBlock).toContain('position: sticky;');
    expect(detailShellTocDesktopBlock).toContain('top: 24px;');
    expect(detailShellTocDesktopBlock).toContain('flex: 0 0 200px;');
    expect(detailShellTocDesktopBlock).toContain('width: 200px;');
    expect(css.match(/\.detail-shell--with-toc \.detail\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '').toContain(
      'margin-inline: 0;',
    );
    expect(detailTocBlock).toContain('border-radius: 16px;');
    expect(detailTocBlock).toContain('border: 1px solid rgba(34, 211, 238, 0.2);');
    expect(detailTocLinkBlock).toContain('color: rgba(226, 232, 240, 0.78);');
    expect(detailBodyImageBlock).toContain('max-width: 40%;');
    expect(detailBodyImageBlock).toContain('width: auto;');
    expect(detailBodyImageBlock).toContain('height: auto;');
    expect(detailBodyImageBlock).toContain('margin: 1.5em auto;');
    expect(commentEmptyBlock).toContain('background: rgba(4, 6, 14, 0.52);');
    expect(adjacentBlock).toContain('background: rgba(4, 6, 14, 0.52);');
    expect(detailLikeButtonBlock).toContain('flex: 0 0 auto;');
    expect(detailLikeButtonBlock).not.toContain('min-height: 40px;');
    expect(detailLikeButtonBlock).not.toContain('padding: 6px 12px;');
    expect(detailTaxonomyLinkBlock).toContain('background: rgba(6, 182, 212, 0.08);');
    expect(detailTaxonomyLinkBlock).toContain('color: #cffafe;');
    expect(detailTaxonomyLinkBlock).toContain('min-height: 40px;');
    expect(detailTaxonomyLinkBlock).toContain('display: inline-flex;');
    expect(detailBodyBlock).not.toContain('background: var(--panel);');
    expect(commentEmptyBlock).not.toContain('background: var(--panel);');
    expect(adjacentBlock).not.toContain('background: var(--panel);');
  });

  test('keeps the selected summer day theme on public reader routes', () => {
    const css = readGlobalStyles();
    const dayPageMainBlock =
      css.match(/:root\[data-theme='summer-day'\] \.page-main\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const dayHeaderBlock =
      css.match(/:root\[data-theme='summer-day'\] body:has\(\.page-main\) \.site-header\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const dayDetailBodyPageBlock =
      css.match(/:root\[data-theme='summer-day'\] body:has\(\.detail\)\s*{(?<body>[\s\S]*?)\n}/)?.groups
        ?.body ?? '';
    const dayDetailArticleBlock =
      css.match(/:root\[data-theme='summer-day'\] \.detail\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const dayDetailBodyBlock =
      css.match(/:root\[data-theme='summer-day'\] \.detail \.detail__body\s*{(?<body>[\s\S]*?)\n}/)?.groups
        ?.body ?? '';
    const dayDetailPageMainBlock =
      css.match(/:root\[data-theme='summer-day'\] \.page-main:has\(\.detail\)\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const dayDetailPageMainBeforeBlock =
      css.match(/:root\[data-theme='summer-day'\] \.page-main:has\(\.detail\)::before\s*{(?<body>[\s\S]*?)\n}/)
        ?.groups?.body ?? '';
    const daySharePageMainBlock =
      css.match(/:root\[data-theme='summer-day'\] \.page-main\.share-page\s*{(?<body>[\s\S]*?)\n}/)?.groups
        ?.body ?? '';
    const nightSharePageMainBlock =
      css.match(/:root\[data-theme='summer-night'\] \.page-main\.share-page\s*{(?<body>[\s\S]*?)\n}/)?.groups
        ?.body ?? '';
    const dayDetailSurfacesBlocks = [
      ...css.matchAll(
        /:root\[data-theme='summer-day'\] \.detail-toc,[\s\S]*?:root\[data-theme='summer-day'\] \.adjacent-content__empty\s*{(?<body>[\s\S]*?)\n}/g,
      ),
    ];
    const dayDetailSurfacesBlock = dayDetailSurfacesBlocks.at(-1)?.groups?.body ?? '';

    expect(css).toContain(":root[data-theme='summer-day'] .page-main");
    expect(css).toContain(":root[data-theme='summer-day'] body:has(.detail)");
    expect(css).toContain(":root[data-theme='summer-day'] body:has(.page-main) .site-header");
    expect(css).toContain(":root[data-theme='summer-day'] .page-main .content-card");
    expect(css).toContain(":root[data-theme='summer-day'] .page-main .archive-list");
    expect(css).toContain(":root[data-theme='summer-day'] .detail");
    expect(css).toContain(":root[data-theme='summer-day'] .detail__body");
    expect(css).toContain(":root[data-theme='summer-day'] .detail .detail__body");
    expect(css).toContain(":root[data-theme='summer-day'] .page-main:has(.detail)");
    expect(css).toContain(":root[data-theme='summer-day'] .page-main::before");
    expect(css).toContain(":root[data-theme='summer-day'] .page-main::after");
    expect(css).toContain(":root[data-theme='summer-day'] .page-main > *");
    expect(dayPageMainBlock).toContain('background: transparent;');
    expect(dayPageMainBlock).not.toContain('linear-gradient(180deg, #d4e8f3');
    expect(dayPageMainBlock).toContain('isolation: isolate;');
    expect(dayPageMainBlock).toContain('overflow: hidden;');
    expect(css).toContain('pointer-events: none;');
    expect(css).toContain('var(--summer-panel-sheen)');
    expect(css).toContain('var(--summer-hover-shadow)');
    expect(css).toContain('var(--summer-glint)');
    expect(dayHeaderBlock).toContain('rgba(255, 255, 244, 0.58)');
    expect(dayHeaderBlock).toContain('backdrop-filter: blur(18px) saturate(1.08);');
    expect(dayHeaderBlock).toContain('0 14px 38px rgba(44, 106, 116, 0.08)');
    expect(dayDetailBodyPageBlock).toContain('radial-gradient(ellipse at 82% 86%, rgba(238, 194, 94, 0.34), transparent 42%)');
    expect(dayDetailBodyPageBlock).toContain('linear-gradient(180deg, #d4e8f3 0%, #e9f7f5 48%, #f7fffb 100%)');
    expect(dayDetailPageMainBlock).toContain('background: transparent;');
    expect(dayDetailPageMainBlock).toContain('animation: none;');
    expect(dayDetailPageMainBlock).not.toContain('linear-gradient(180deg, #d4e8f3');
    expect(daySharePageMainBlock).toContain('background: transparent;');
    expect(daySharePageMainBlock).not.toContain('var(--share-bg)');
    expect(nightSharePageMainBlock).toContain('background: transparent;');
    expect(nightSharePageMainBlock).not.toContain('var(--share-bg)');
    expect(dayDetailPageMainBlock).toContain('overflow: visible;');
    expect(dayDetailPageMainBeforeBlock).toContain('animation: none;');
    expect(dayDetailPageMainBeforeBlock).toContain('rgba(247, 218, 57, 0.22)');
    expect(dayDetailArticleBlock).toContain('rgba(255, 255, 255, 0.82)');
    expect(dayDetailArticleBlock).toContain('backdrop-filter: blur(18px) saturate(1.06);');
    expect(dayDetailArticleBlock).toContain('var(--summer-line)');
    expect(dayDetailBodyBlock).toContain('background: transparent;');
    expect(dayDetailBodyBlock).toContain('backdrop-filter: none;');
    expect(dayDetailBodyBlock).toContain('border: 0;');
    expect(dayDetailBodyBlock).toContain('box-shadow: none;');
    expect(dayDetailSurfacesBlock).toContain('backdrop-filter: none;');
    expect(dayDetailSurfacesBlock).toContain('#fbfffb');
  });

  test('keeps like feedback compact and readable in article metadata', () => {
    const css = readGlobalStyles();
    const likeWrapBlock = css.match(/\.like-button-wrap\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const likeButtonBlock = css.match(/\.like-button\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const likeButtonCountBlock = css.match(/\.like-button__count\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const likeButtonIconBlock = css.match(/\.like-button__icon\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const likeMessageBlock = css.match(/\.like-button__message\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';

    expect(css).toContain('.like-button-wrap');
    expect(css).toContain('.like-button__count');
    expect(css).toContain('.like-button__icon');
    expect(css).toContain('.like-button__message');
    expect(likeButtonBlock).toContain('height: 48px;');
    expect(likeButtonBlock).toContain('width: 48px;');
    expect(likeButtonBlock).toContain('border-radius: 999px;');
    expect(likeButtonBlock).toContain('color: #fecdd3;');
    expect(likeButtonCountBlock).toContain('left: 28px;');
    expect(likeButtonCountBlock).toContain('top: -8px;');
    expect(likeButtonIconBlock).toContain('transition: fill 180ms ease');
    expect(likeButtonIconBlock).toContain('opacity: 1;');
    expect(likeWrapBlock).toContain('display: inline-flex;');
    expect(likeWrapBlock).toContain('align-items: center;');
    expect(likeMessageBlock).toContain('color: var(--cyber-cyan);');
    expect(likeMessageBlock).not.toContain('background: #fff;');
  });

  test('shows the public comment login gate beside the clicked comment entry', () => {
    const css = readGlobalStyles();
    const entryBlock = css.match(/\.comment-login-entry\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const modalBlock = css.match(/\.comment-login-modal\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const backdropBlock = css.match(/\.comment-login-modal__backdrop\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const panelBlock = css.match(/\.comment-login-modal__panel\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';

    expect(css).toContain('.comment-login-entry__button');
    expect(entryBlock).toContain('display: flex;');
    expect(entryBlock).toContain('flex-direction: column;');
    expect(entryBlock).toContain('position: relative;');
    expect(modalBlock).toContain('position: relative;');
    expect(modalBlock).toContain('margin-top: 12px;');
    expect(modalBlock).toContain('z-index: 5;');
    expect(modalBlock).not.toContain('position: fixed;');
    expect(modalBlock).not.toContain('place-items: center;');
    expect(backdropBlock).toContain('inset: 0;');
    expect(backdropBlock).toContain('border-radius: 20px;');
    expect(backdropBlock).toContain('backdrop-filter: blur(8px) saturate(1.08);');
    expect(panelBlock).toContain('animation: comment-login-panel-in');
    expect(css).toContain(":root[data-theme='summer-day'] .comment-login-modal__backdrop");
  });
});
