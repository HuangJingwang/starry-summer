// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, test, vi } from 'vitest';
import { ArticleReadingGuide } from './ArticleReadingGuide';

test('guide follows actual headings and collapses mobile navigation after selection', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const headings = [{ slug: 'opening', text: '开篇', depth: 2 }, { slug: 'details', text: '细节', depth: 3 }];
  await act(async () => root.render(<><ArticleReadingGuide headings={headings} /><div className="detail__body"><h2 id="opening">开篇</h2><h3 id="details">细节</h3></div></>));
  // Both desktop and mobile links reference real article IDs, not a separate route.
  for (const link of host.querySelectorAll('.detail-toc a')) expect(document.getElementById(link.getAttribute('href')!.slice(1))).not.toBeNull();
  expect(host.querySelector('.detail-toc [aria-current="location"]')?.getAttribute('href')).toBe('#details');
  const mobile = host.querySelector('details')!;
  mobile.open = true;
  await act(async () => mobile.querySelector<HTMLAnchorElement>('a')!.click());
  expect(mobile.open).toBe(false);
  await act(async () => root.unmount());
  host.remove(); vi.unstubAllGlobals();
});
