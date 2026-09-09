// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { PublicPersistentNav } from './PublicPersistentNav';

const location = vi.hoisted(() => ({ pathname: '/posts/a-story' }));
vi.mock('next/navigation', () => ({ usePathname: () => location.pathname }));
let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('matchMedia', () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  location.pathname = '/posts/a-story';
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
const render = () => act(async () => root.render(<PublicPersistentNav title="Starry Summer" navItems={[]} />));

test('reader navigation keeps a real homepage return and a shared, current-location Dock', async () => {
  await render();
  const dock = host.querySelector('nav[aria-label="快捷导航"]');
  expect(dock).not.toBeNull();
  expect(dock!.querySelector('a[aria-label="首页"]')?.getAttribute('href')).toBe('/');
  expect(dock!.querySelector('a[aria-current="page"]')?.getAttribute('href')).toBe('/posts');
  expect(host.querySelector('a[aria-label="Aster.H · 返回首页"]')?.getAttribute('href')).toBe('/');
});

test('the mobile directory opens, closes with Escape and preserves destinations', async () => {
  await render();
  const toggle = host.querySelector<HTMLButtonElement>('button[aria-label="打开站点目录"]');
  expect(toggle).not.toBeNull();
  await act(async () => toggle!.click());
  expect(toggle!.getAttribute('aria-expanded')).toBe('true');
  const menu = host.querySelector('[aria-label="站点目录"]');
  expect([...menu!.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(expect.arrayContaining(['/notes', '/moments', '/series', '/categories', '/tags', '/archives', '/about', '/leetcode']));
  await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  expect(toggle!.getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(toggle);
});

test('admin routes never receive the public redesign controls', async () => {
  location.pathname = '/admin/content';
  await render();
  expect(host.querySelector('header')).toBeNull();
  expect(host.querySelector('nav')).toBeNull();
});
