'use client';

import { useEffect } from 'react';

const previewLinkSelector = 'a.xmind-preview-link[data-xmind-src]';

export function XMindPreviewEnhancer() {
  useEffect(() => {
    const links = [...document.querySelectorAll<HTMLAnchorElement>(previewLinkSelector)];

    if (links.length === 0) {
      return;
    }

    const cleanups: Array<() => void> = [];

    for (const link of links) {
      if (link.getAttribute('data-xmind-rendered') === 'true') {
        continue;
      }

      link.setAttribute('data-xmind-rendered', 'true');
      const source = link.dataset.xmindSrc || link.href;
      const title = link.dataset.xmindTitle || link.textContent?.trim() || 'XMind 脑图';
      const preview = createPreviewShell({ source, title });
      const anchorBlock = link.closest('p') ?? link;

      anchorBlock.insertAdjacentElement('afterend', preview.root);
      cleanups.push(() => {
        preview.root.remove();
        link.removeAttribute('data-xmind-rendered');
      });

      const loadPreview = () => {
        renderXMindPreview({
          source,
          title,
          status: preview.status,
          mount: preview.mount,
        });
      };

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
          (entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) {
              return;
            }

            observer.disconnect();
            loadPreview();
          },
          { rootMargin: '240px 0px' },
        );

        observer.observe(preview.root);
        cleanups.push(() => observer.disconnect());
      } else {
        loadPreview();
      }
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}

function createPreviewShell({ source, title }: { source: string; title: string }) {
  const root = document.createElement('section');
  root.className = 'xmind-preview';
  root.dataset.xmindStatus = 'idle';
  root.setAttribute('aria-label', `${title} 预览`);

  const header = document.createElement('div');
  header.className = 'xmind-preview__header';

  const label = document.createElement('div');
  label.className = 'xmind-preview__label';

  const eyebrow = document.createElement('span');
  eyebrow.className = 'xmind-preview__eyebrow';
  eyebrow.textContent = 'XMind';

  const heading = document.createElement('strong');
  heading.textContent = title;

  label.append(eyebrow, heading);

  const download = document.createElement('a');
  download.className = 'xmind-preview__download';
  download.href = source;
  download.textContent = '下载原文件';
  download.setAttribute('download', '');

  header.append(label, download);

  const status = document.createElement('p');
  status.className = 'xmind-preview__status';
  status.textContent = '滚动到这里后加载脑图预览';

  const mount = document.createElement('div');
  mount.className = 'xmind-preview__mount';

  root.append(header, status, mount);

  return { root, status, mount };
}

function renderXMindPreview({
  source,
  title,
  status,
  mount,
}: {
  source: string;
  title: string;
  status: HTMLParagraphElement;
  mount: HTMLDivElement;
}) {
  const root = mount.closest<HTMLElement>('.xmind-preview');
  const frame = createPreviewFrame({ source, title });
  const readyTimer = window.setTimeout(() => {
    root?.setAttribute('data-xmind-status', 'error');
    status.textContent = '加载失败：XMind 预览渲染超时';
  }, 20000);
  const handleMessage = (event: MessageEvent) => {
    if (event.source !== frame.contentWindow || event.origin !== window.location.origin) {
      return;
    }

    if (event.data?.type === 'starry-xmind-preview:ready') {
      window.clearTimeout(readyTimer);
      window.removeEventListener('message', handleMessage);
      root?.setAttribute('data-xmind-status', 'ready');
      status.textContent = `${title} 已加载`;
    }

    if (event.data?.type === 'starry-xmind-preview:error') {
      window.clearTimeout(readyTimer);
      window.removeEventListener('message', handleMessage);
      root?.setAttribute('data-xmind-status', 'error');
      status.textContent = `加载失败：${event.data.message || 'XMind 预览不可用'}`;
    }
  };

  root?.setAttribute('data-xmind-status', 'loading');
  status.textContent = '正在加载 XMind 脑图...';
  window.addEventListener('message', handleMessage);
  mount.replaceChildren(frame);
}

function createPreviewFrame({ source, title }: { source: string; title: string }) {
  const frame = document.createElement('iframe');
  const params = new URLSearchParams({
    file: source,
    title,
  });

  frame.src = `/xmind-preview-frame.html?${params.toString()}`;
  frame.title = `${title} XMind 预览`;
  frame.loading = 'lazy';
  frame.setAttribute('allowfullscreen', 'true');
  frame.setAttribute('allow', 'fullscreen');

  return frame;
}
