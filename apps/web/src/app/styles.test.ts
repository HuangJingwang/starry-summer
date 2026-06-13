import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

const styleImportOrder = ['src/app/styles.css', 'src/app/styles/admin.css', 'src/app/styles/responsive.css'];

function readStylesheet(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function readGlobalStyles() {
  return styleImportOrder.map(readStylesheet).join('\n');
}

describe('global styles', () => {
  test('keeps global CSS split by public, admin, and responsive concerns', () => {
    const rootLayout = readFileSync(join(process.cwd(), 'src/app/layout.tsx'), 'utf8');
    const baseCss = readStylesheet('src/app/styles.css');
    const adminCss = readStylesheet('src/app/styles/admin.css');
    const responsiveCss = readStylesheet('src/app/styles/responsive.css');

    expect(rootLayout).toContain("import './styles.css';");
    expect(rootLayout).toContain("import './styles/admin.css';");
    expect(rootLayout).toContain("import './styles/responsive.css';");
    expect(baseCss).not.toContain('.admin-layout {');
    expect(baseCss).not.toContain('@media (max-width: 820px)');
    expect(adminCss).toContain('.admin-layout {');
    expect(adminCss).toContain('.admin-primary-nav a[aria-current="page"]');
    expect(responsiveCss).toContain('@media (max-width: 820px)');
    expect(responsiveCss).toContain('.admin-layout,');
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
    expect(css).toContain('.admin-primary-nav a[aria-current="page"]');
    expect(css).toContain('.admin-stat-card');
    expect(css).toContain('.admin-workflow-grid');
    expect(css).toContain('.admin-ops-grid');
    expect(css).toContain('.admin-ops-card');
    expect(css).toContain('.admin-panel');
    expect(css).toContain('.admin-table-bulkbar');
    expect(css).toContain('.admin-table-select');
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

  test('defines the README screenshot portfolio hero without the abandoned landing system', () => {
    const css = readGlobalStyles();

    expect(css).toContain('.portfolio-home');
    expect(css).toContain('.portfolio-hero');
    expect(css).toContain('.portfolio-hero__content');
    expect(css).toContain('.portfolio-hero__name');
    expect(css).toContain('.portfolio-hero__role');
    expect(css).toContain('.portfolio-hero__stats');
    expect(css).toContain('grid-template-columns: repeat(auto-fit, minmax(116px, 1fr));');
    expect(css).toContain('.portfolio-hero__stats div');
    expect(css).toContain('min-width: 0;');
    expect(css).toContain('.portfolio-hero__stats dd');
    expect(css).toContain('max-width: 100%;');
    expect(css).toContain('overflow-wrap: anywhere;');
    expect(css).not.toContain('.portfolio-hero__stats dd {\n  color: #fff;\n  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;\n  font-size: clamp(1.18rem, 2vw, 1.6rem);\n  font-weight: 900;\n  margin: 0;\n  white-space: nowrap;\n}');
    expect(css).toContain('.portfolio-hero__actions');
    expect(css).toContain('.portfolio-hero__portrait');
    expect(css).toContain('.portfolio-hero__scroll');
    expect(css).toContain('.portfolio-hero__canvas');
    expect(css).toContain('min-height: 100vh;');
    expect(css).not.toContain('.home-landing');
    expect(css).not.toContain('.home-overview');
    expect(css).not.toContain('animation: home-scroll-float');
    expect(css).not.toContain('font-size: clamp(3.2rem, 7vw, 6.8rem);');
    expect(css).not.toContain('font-size: clamp(4.2rem, 15vw, 12.5rem);');
    expect(css).toContain('var(--cyber-cyan)');
    expect(css).not.toContain('#CCFF00');
    expect(css).not.toContain('#ccff00');
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

  test('keeps the portfolio home navigation visible while preserving the full-screen hero', () => {
    const css = readGlobalStyles();
    const heroBlock = css.match(/\.portfolio-hero\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const portfolioHomeBlock = css.match(/\.portfolio-home,[\s\S]*?\.portfolio-about-panel\s*{(?<body>[\s\S]*?)\n}/)?.groups
      ?.body ?? '';

    expect(heroBlock).toContain('min-height: 100vh;');
    expect(portfolioHomeBlock).toContain('color: var(--cyber-ink);');
    expect(css).toContain('body:has(.portfolio-home) .site-header');
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
    const siteNavLinkBlock = css.match(/\.site-nav a\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const mobileSiteNavItemsBlock =
      responsiveCss.match(/\.site-nav__items\s*{(?<body>[\s\S]*?)\n  }/)?.groups?.body ?? '';

    expect(css).toContain('.site-header');
    expect(css).toContain('.site-nav-card');
    expect(css).toContain('.site-nav-card__brand');
    expect(css).toContain('.site-nav-card__group-label');
    expect(css).toContain('.site-nav__items');
    expect(css).toContain('.site-nav');
    expect(css).toContain('.site-search');
    expect(css).toContain('.site-search input');
    expect(css).toContain('width: min(100% - 32px, 760px);');
    expect(css).toContain('border-radius: 22px;');
    expect(siteNavLinkBlock).toContain('min-height: 34px;');
    expect(siteNavLinkBlock).toContain('padding: 0 12px;');
    expect(siteNavLinkBlock).toContain('display: inline-flex;');
    expect(responsiveCss).toContain('.site-nav-card__group-label');
    expect(responsiveCss).toContain('display: none;');
    expect(mobileSiteNavItemsBlock).toContain('overflow-x: auto;');
    expect(mobileSiteNavItemsBlock).toContain('scrollbar-width: none;');
    expect(css).not.toContain('.portfolio-hero__nav');
  });

  test('uses a full-width README-style top bar on the portfolio home page', () => {
    const css = readGlobalStyles();
    const portfolioHeaderBlock =
      css.match(/body:has\(\.portfolio-home\) \.site-header\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const portfolioGroupLabelBlock =
      css.match(/body:has\(\.portfolio-home\) \.site-nav-card__group-label\s*{(?<body>[\s\S]*?)\n}/)?.groups
        ?.body ?? '';
    const portfolioSearchBlock =
      css.match(/body:has\(\.portfolio-home\) \.site-search\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';

    expect(portfolioHeaderBlock).toContain('border-radius: 0;');
    expect(portfolioHeaderBlock).toContain('grid-template-columns: auto minmax(0, 1fr) minmax(220px, 260px);');
    expect(portfolioHeaderBlock).toContain('margin: 0;');
    expect(portfolioHeaderBlock).toContain('top: 0;');
    expect(portfolioHeaderBlock).toContain('width: 100%;');
    expect(portfolioGroupLabelBlock).toContain('display: none;');
    expect(portfolioSearchBlock).toContain('justify-self: end;');
    expect(portfolioSearchBlock).toContain('width: min(100%, 260px);');
  });

  test('keeps the guestbook page inside the cyber glass visual system', () => {
    const css = readGlobalStyles();

    expect(css).toContain('.guestbook-page');
    expect(css).toContain('.guestbook-copy-card');
    expect(css).toContain('.guestbook-panel');
    expect(css).toContain('.guestbook-page .guestbook-form');
    expect(css).toContain('.guestbook-page .guestbook-form button');
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
    const contentCardTitleLinkBlock = css.match(/\.page-main \.content-card h3 a\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const searchTitleLinkBlock = css.match(/\.search-result-card h2 a\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';

    expect(css).toContain('.page-main .content-card');
    expect(css).toContain('.page-main .category-section__heading');
    expect(css).toContain('.page-main .archive-list');
    expect(css).toContain('.page-main .content-card__series a');
    expect(contentCardTitleLinkBlock).toContain('min-height: 40px;');
    expect(contentCardTitleLinkBlock).toContain('display: inline-flex;');
    expect(searchTitleLinkBlock).toContain('min-height: 40px;');
    expect(searchTitleLinkBlock).toContain('display: inline-flex;');
    expect(css).toContain('.page-main .content-card h3 a:focus-visible');
    expect(css).toContain('.search-result-card h2 a:focus-visible');
  });

  test('keeps the public about page inside the cyber glass visual system', () => {
    const css = readGlobalStyles();
    const aboutItemBlock = css.match(/\.about-list__item\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';

    expect(css).toContain('.about-list__item');
    expect(aboutItemBlock).toContain('background: rgba(4, 6, 14, 0.46);');
    expect(aboutItemBlock).toContain('border: 1px solid rgba(148, 163, 184, 0.16);');
    expect(aboutItemBlock).not.toContain('background: #fff;');
  });

  test('keeps public article detail surfaces inside the cyber glass visual system', () => {
    const css = readGlobalStyles();
    const detailBodyBlock = css.match(/\.detail__body\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const commentEmptyBlock = css.match(/\.detail-comments__list li,[\s\S]*?\.detail-comments__empty\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const adjacentBlock = css.match(/\.adjacent-content a,[\s\S]*?\.adjacent-content__empty\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const detailLikeButtonBlock = css.match(/\.detail__meta \.like-button\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const detailTaxonomyLinkBlock = css.match(/\.page-main \.detail-taxonomy a\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';

    expect(detailBodyBlock).toContain('background: rgba(4, 6, 14, 0.58);');
    expect(commentEmptyBlock).toContain('background: rgba(4, 6, 14, 0.52);');
    expect(adjacentBlock).toContain('background: rgba(4, 6, 14, 0.52);');
    expect(detailLikeButtonBlock).toContain('min-height: 40px;');
    expect(detailLikeButtonBlock).not.toContain('min-height: 30px;');
    expect(detailTaxonomyLinkBlock).toContain('background: rgba(6, 182, 212, 0.08);');
    expect(detailTaxonomyLinkBlock).toContain('color: #cffafe;');
    expect(detailTaxonomyLinkBlock).toContain('min-height: 40px;');
    expect(detailTaxonomyLinkBlock).toContain('display: inline-flex;');
    expect(detailBodyBlock).not.toContain('background: var(--panel);');
    expect(commentEmptyBlock).not.toContain('background: var(--panel);');
    expect(adjacentBlock).not.toContain('background: var(--panel);');
  });

  test('keeps like feedback compact and readable in article metadata', () => {
    const css = readGlobalStyles();
    const likeWrapBlock = css.match(/\.like-button-wrap\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const likeMessageBlock = css.match(/\.like-button__message\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';

    expect(css).toContain('.like-button-wrap');
    expect(css).toContain('.like-button__message');
    expect(likeWrapBlock).toContain('display: inline-flex;');
    expect(likeWrapBlock).toContain('align-items: center;');
    expect(likeMessageBlock).toContain('color: var(--cyber-cyan);');
    expect(likeMessageBlock).not.toContain('background: #fff;');
  });
});
