import { describe, expect, test } from 'vitest';

import { applyMarkdownCommand, createMarkdownEditorStats } from './markdown-editor';

describe('markdown editor helpers', () => {
  test('wraps selected text in bold markers and preserves the selected text range', () => {
    const result = applyMarkdownCommand('Hello world', { start: 6, end: 11 }, 'bold');

    expect(result).toEqual({
      markdown: 'Hello **world**',
      selectionStart: 8,
      selectionEnd: 13,
    });
  });

  test('turns the current line into a heading', () => {
    const result = applyMarkdownCommand('Intro\nSection title\nBody', { start: 8, end: 8 }, 'heading');

    expect(result.markdown).toBe('Intro\n# Section title\nBody');
    expect(result.selectionStart).toBe(6);
    expect(result.selectionEnd).toBe(21);
  });

  test('turns selected lines into an unordered list', () => {
    const result = applyMarkdownCommand('alpha\nbeta\ngamma', { start: 0, end: 10 }, 'unordered-list');

    expect(result.markdown).toBe('- alpha\n- beta\ngamma');
  });

  test('inserts a fenced code block for multi-line selections', () => {
    const markdown = 'const a = 1;\nconst b = 2;';
    const result = applyMarkdownCommand(markdown, { start: 0, end: markdown.length }, 'code-block');

    expect(result.markdown).toBe('```ts\nconst a = 1;\nconst b = 2;\n```');
  });

  test('summarizes markdown size for the editor sidebar', () => {
    expect(createMarkdownEditorStats('# Title\n\nBody line')).toEqual({
      lineCount: 3,
      characterCount: 18,
      readingTime: '1 分钟阅读',
    });
  });
});
