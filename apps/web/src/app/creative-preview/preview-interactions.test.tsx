// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { motionValue } from 'framer-motion';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { BlogHomePreview } from './CreativePortfolioPreview';
import { selectPreviewContent } from './preview-content';

const scroll = motionValue(0);
const preferences = vi.hoisted(() => ({ reduced: false }));
vi.mock('framer-motion', async (original) => ({
  ...await original<typeof import('framer-motion')>(),
  useScroll: () => ({ scrollYProgress: scroll }),
  useReducedMotion: () => preferences.reduced,
}));
vi.mock('./OrbitalScene', () => ({ OrbitalScene: () => null }));

const content = selectPreviewContent(Array.from({ length: 6 }, (_, i) => ({
  id: `story-${i}`, slug: `story-${i}`, title: `故事 ${i}`, type: 'post' as const,
  status: 'published' as const, visibility: 'public' as const, publishedAt: `2026-09-0${i + 1}`,
})));
let container: HTMLDivElement;
let root: Root;
const settle = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 40)); });
const click = async (element: Element) => act(async () => { element.dispatchEvent(new MouseEvent('click', { bubbles: true })); });

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: query.includes('pointer: fine'), addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} })));
  scroll.set(0);
  preferences.reduced = false;
  sessionStorage.clear();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const top = ({ top: 0, fragments: 1000, latest: 2400, routes: 5000 } as Record<string, number>)[this.id] ?? 0;
    return { top, bottom: top + 800, left: 0, right: 1200, x: 0, y: top, width: 1200, height: 800, toJSON() {} };
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function render(empty = false) {
  await act(async () => root.render(<BlogHomePreview {...(empty ? selectPreviewContent([]) : content)} description="Aster.H 的个人博客" />));
  await settle();
}

describe('preview reading and navigation', () => {
  test('all section links still resolve when no articles have been published', async () => {
    await render(true);
    const anchors = [...container.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
    expect(anchors.length).toBeGreaterThan(0);
    for (const anchor of anchors) expect(document.getElementById(anchor.hash.slice(1)), anchor.textContent ?? '').not.toBeNull();
  });

  test('each gallery story is a single, exposed link that survives pointer focus', async () => {
    await render();
    const links = [...container.querySelectorAll<HTMLAnchorElement>('#fragments a')];
    expect(links).toHaveLength(content.galleryEntries.length);
    expect(new Set(links.map((link) => link.pathname)).size).toBe(links.length);
    for (const link of links) {
      await act(async () => { link.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })); link.focus(); });
      expect(link.isConnected).toBe(true);
      expect(link.getAttribute('aria-hidden')).not.toBe('true');
      expect(link.tabIndex).toBe(0);
    }
  });

  test('Dock uses real section and search links, not click-only placeholder controls', async () => {
    await render();
    const dock = container.querySelector('nav[aria-label="快捷导航"]');
    expect(dock).not.toBeNull();
    expect([...dock!.querySelectorAll('a')].map((link) => link.getAttribute('href'))).toEqual(['#top', '#latest', '#fragments', '#routes', '/search']);
    expect(dock!.querySelector('a[aria-current="location"]')?.getAttribute('href')).toBe('#top');
    const links = dock!.querySelectorAll('a');
    await act(async () => {
      links[0]!.focus();
      links[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    expect(document.activeElement).toBe(links[1]);
    Object.defineProperty(document.getElementById('latest')!, 'getBoundingClientRect', { value: () => ({ top: 30 }) });
    await act(async () => { window.dispatchEvent(new Event('scroll')); });
    await settle();
    expect(dock!.querySelector('a[aria-current="location"]')?.getAttribute('href')).toBe('#latest');
  });

  test('manual gallery browsing takes ownership from scroll-driven animation', async () => {
    await render();
    const row = container.querySelector<HTMLElement>('[aria-label="第一排内容切片"]');
    expect(row).not.toBeNull();
    Object.defineProperties(row!, { scrollWidth: { value: 1800 }, clientWidth: { value: 600 } });
    await act(async () => { scroll.set(0.4); });
    expect(row!.scrollLeft).toBeGreaterThan(0);
    await act(async () => { row!.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })); });
    row!.scrollLeft = 170;
    await act(async () => { scroll.set(0.8); });
    expect(row!.scrollLeft).toBe(170);
    await act(async () => { row!.dispatchEvent(new Event('scroll')); });
    await act(async () => { root.unmount(); });
    root = createRoot(container);
    await render();
    expect(container.querySelector('[aria-label="第一排内容切片"]')!.scrollLeft).toBe(170);
  });

  test('pause freezes scroll motion without switching layout and survives a return visit', async () => {
    await render();
    await act(async () => { scroll.set(0.4); });
    await settle();
    const heading = container.querySelector('h1')!.parentElement!;
    const before = heading.style.transform;
    expect(before).not.toBe('');
    await click(container.querySelector('[aria-label="暂停动态效果"]')!);
    expect(container.querySelector('main')!.dataset.motion).toBe('full');
    expect(container.querySelector('main')!.dataset.paused).toBe('true');
    await act(async () => { scroll.set(0.8); });
    await settle();
    expect(heading.style.transform).toBe(before);
    await act(async () => { root.unmount(); });
    root = createRoot(container);
    await render();
    expect(container.querySelector('[aria-label="继续动态效果"]')?.getAttribute('aria-pressed')).toBe('true');
    await click(container.querySelector('[aria-label="继续动态效果"]')!);
    expect(container.querySelector('main')!.dataset.paused).toBe('false');
  });

  test('pause remains usable when browser storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => { if (key.includes('preview')) throw new Error('Storage blocked'); return null; });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage blocked'); });
    await render();
    await click(container.querySelector('[aria-label="暂停动态效果"]')!);
    expect(container.querySelector('[aria-label="继续动态效果"]')?.getAttribute('aria-pressed')).toBe('true');
  });

  test('system reduced motion keeps scroll transforms still without removing reading links', async () => {
    preferences.reduced = true;
    await render();
    const heading = container.querySelector('h1')!.parentElement!;
    const before = heading.style.transform;
    await act(async () => { scroll.set(0.8); });
    await settle();
    expect(container.querySelector('main')!.dataset.motion).toBe('reduced');
    expect(heading.style.transform).toBe(before);
    expect(container.querySelectorAll('#fragments a')).toHaveLength(content.galleryEntries.length);
    expect(container.querySelector('a[aria-label="搜索文章"]')?.getAttribute('href')).toBe('/search');
  });
});
