'use client';

import { useEffect } from 'react';

const defaultCopyLabel = '复制代码';
const defaultCopyAriaLabel = '复制代码块';
const successCopyLabel = '已复制';
const successCopyAriaLabel = '代码已复制';
const failureCopyLabel = '复制失败';
const failureCopyAriaLabel = '代码复制失败';

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

      const didCopy = await copyText(code);
      button.textContent = didCopy ? successCopyLabel : failureCopyLabel;
      button.setAttribute('aria-label', didCopy ? successCopyAriaLabel : failureCopyAriaLabel);
      window.setTimeout(() => {
        button.textContent = defaultCopyLabel;
        button.setAttribute('aria-label', defaultCopyAriaLabel);
      }, 1_500);
    }

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return null;
}
