'use client';

import { useEffect } from 'react';

export function CodeCopyEnhancer() {
  useEffect(() => {
    async function copyText(text: string) {
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } catch {
        // Fall back below for browsers that deny clipboard access.
      }

      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.setAttribute('readonly', 'true');
        textArea.style.position = 'fixed';
        textArea.style.inset = '-9999px auto auto -9999px';
        document.body.append(textArea);
        textArea.select();
        const didCopy = document.execCommand('copy');
        textArea.remove();
        return didCopy;
      } catch {
        return false;
      }
    }

    async function handleClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest<HTMLButtonElement>('button[data-copy-code]');

      if (!button) {
        return;
      }

      const code = button.closest('.markdown-code-block')?.querySelector('pre code')?.textContent;

      if (!code) {
        return;
      }

      const originalLabel = button.textContent ?? 'Copy';
      const didCopy = await copyText(code);
      button.textContent = didCopy ? 'Copied' : 'Failed';
      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 1_500);
    }

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return null;
}
