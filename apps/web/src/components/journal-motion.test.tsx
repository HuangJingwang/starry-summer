// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, test, vi } from 'vitest';
import { usePreviewPause } from '@/app/creative-preview/use-preview-motion';
import { JournalMotion } from './JournalMotion';

vi.mock('next/navigation', () => ({ usePathname: () => '/posts' }));

test('pause is shared by the dock and reader and survives navigation', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  sessionStorage.clear();
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  function Control() { const [paused, toggle] = usePreviewPause(); return <button onClick={toggle}>{String(paused)}</button>; }
  await act(async () => root.render(<><Control /><Control /></>));
  await act(async () => host.querySelector('button')!.click());
  expect([...host.querySelectorAll('button')].map(e => e.textContent)).toEqual(['true', 'true']);
  expect(document.documentElement.dataset.motionPaused).toBe('true');
  await act(async () => root.unmount());
  const next = createRoot(host);
  await act(async () => next.render(<Control />));
  expect(host.textContent).toBe('true');
  await act(async () => next.unmount());
  host.remove();
});

test('scroll reveals never change React-owned attributes before hydration and cancel on unmount', async () => {
  sessionStorage.clear();
  delete document.documentElement.dataset.motionPaused;
  vi.stubGlobal('matchMedia', () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
  let callback: IntersectionObserverCallback;
  const observe = vi.fn();
  const disconnect = vi.fn();
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: IntersectionObserverCallback) { callback = cb; }
    observe = observe;
    unobserve() {}
    disconnect = disconnect;
  });
  const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 9999 } as DOMRect);
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(<div className="journal-shell"><JournalMotion /><main><a className="posts-archive-item" href="/posts/story">文章</a></main></div>));
  const target = host.querySelector('a')!;
  const cancel = vi.fn();
  const animate = vi.fn(() => ({ cancel }));
  Object.assign(target, { animate });
  expect(observe).toHaveBeenCalledWith(target);
  expect(target.getAttribute('data-reveal')).toBeNull();
  await act(async () => callback!([{ target, isIntersecting: true } as unknown as IntersectionObserverEntry], {} as IntersectionObserver));
  expect(animate).toHaveBeenCalledOnce();
  expect(target.getAttribute('style')).toBeNull();
  expect(target.getAttribute('data-reveal')).toBeNull();
  await act(async () => root.unmount());
  expect(cancel).toHaveBeenCalledOnce();
  expect(disconnect).toHaveBeenCalled();
  host.remove(); rect.mockRestore(); vi.unstubAllGlobals();
});
