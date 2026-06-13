import { estimateReadingTime } from './content';

export type MarkdownEditorCommand =
  | 'bold'
  | 'italic'
  | 'heading'
  | 'link'
  | 'quote'
  | 'unordered-list'
  | 'ordered-list'
  | 'code-block'
  | 'divider';

export interface MarkdownEditorSelection {
  start: number;
  end: number;
}

export interface MarkdownEditorResult {
  markdown: string;
  selectionStart: number;
  selectionEnd: number;
}

export interface MarkdownEditorStats {
  lineCount: number;
  characterCount: number;
  readingTime: string;
}

export function applyMarkdownCommand(
  markdown: string,
  selection: MarkdownEditorSelection,
  command: MarkdownEditorCommand,
): MarkdownEditorResult {
  const normalizedSelection = normalizeSelection(selection, markdown.length);

  switch (command) {
    case 'bold':
      return wrapSelection(markdown, normalizedSelection, '**', '**', '加粗文本');
    case 'italic':
      return wrapSelection(markdown, normalizedSelection, '*', '*', '斜体文本');
    case 'heading':
      return prefixSelectedLines(markdown, normalizedSelection, () => '# ');
    case 'link':
      return insertLink(markdown, normalizedSelection);
    case 'quote':
      return prefixSelectedLines(markdown, normalizedSelection, () => '> ');
    case 'unordered-list':
      return prefixSelectedLines(markdown, normalizedSelection, () => '- ');
    case 'ordered-list':
      return prefixSelectedLines(markdown, normalizedSelection, (index) => `${index + 1}. `);
    case 'code-block':
      return insertCodeBlock(markdown, normalizedSelection);
    case 'divider':
      return insertDivider(markdown, normalizedSelection);
  }
}

export function createMarkdownEditorStats(markdown: string): MarkdownEditorStats {
  return {
    lineCount: markdown.length === 0 ? 1 : markdown.split('\n').length,
    characterCount: markdown.length,
    readingTime: estimateReadingTime(markdown),
  };
}

function normalizeSelection(selection: MarkdownEditorSelection, markdownLength: number): MarkdownEditorSelection {
  const start = clamp(selection.start, 0, markdownLength);
  const end = clamp(selection.end, 0, markdownLength);

  return {
    start: Math.min(start, end),
    end: Math.max(start, end),
  };
}

function wrapSelection(
  markdown: string,
  selection: MarkdownEditorSelection,
  prefix: string,
  suffix: string,
  placeholder: string,
): MarkdownEditorResult {
  const selectedText = markdown.slice(selection.start, selection.end) || placeholder;
  const nextMarkdown = `${markdown.slice(0, selection.start)}${prefix}${selectedText}${suffix}${markdown.slice(selection.end)}`;
  const selectionStart = selection.start + prefix.length;

  return {
    markdown: nextMarkdown,
    selectionStart,
    selectionEnd: selectionStart + selectedText.length,
  };
}

function insertLink(markdown: string, selection: MarkdownEditorSelection): MarkdownEditorResult {
  const selectedText = markdown.slice(selection.start, selection.end) || '链接文本';
  const insert = `[${selectedText}](https://example.com)`;
  const nextMarkdown = `${markdown.slice(0, selection.start)}${insert}${markdown.slice(selection.end)}`;

  return {
    markdown: nextMarkdown,
    selectionStart: selection.start + 1,
    selectionEnd: selection.start + 1 + selectedText.length,
  };
}

function insertCodeBlock(markdown: string, selection: MarkdownEditorSelection): MarkdownEditorResult {
  const selectedText = markdown.slice(selection.start, selection.end) || 'console.log("hello");';
  const isMultiline = selectedText.includes('\n');
  const prefix = isMultiline ? '```ts\n' : '`';
  const suffix = isMultiline ? '\n```' : '`';
  const nextMarkdown = `${markdown.slice(0, selection.start)}${prefix}${selectedText}${suffix}${markdown.slice(selection.end)}`;
  const selectionStart = selection.start + prefix.length;

  return {
    markdown: nextMarkdown,
    selectionStart,
    selectionEnd: selectionStart + selectedText.length,
  };
}

function insertDivider(markdown: string, selection: MarkdownEditorSelection): MarkdownEditorResult {
  const needsLeadingBreak = selection.start > 0 && !markdown.slice(0, selection.start).endsWith('\n\n');
  const needsTrailingBreak = selection.end < markdown.length && !markdown.slice(selection.end).startsWith('\n\n');
  const insert = `${needsLeadingBreak ? '\n\n' : ''}---${needsTrailingBreak ? '\n\n' : ''}`;
  const nextMarkdown = `${markdown.slice(0, selection.start)}${insert}${markdown.slice(selection.end)}`;
  const cursor = selection.start + insert.length;

  return {
    markdown: nextMarkdown,
    selectionStart: cursor,
    selectionEnd: cursor,
  };
}

function prefixSelectedLines(
  markdown: string,
  selection: MarkdownEditorSelection,
  prefixForLine: (lineIndex: number) => string,
): MarkdownEditorResult {
  const bounds = getSelectedLineBounds(markdown, selection);
  const block = markdown.slice(bounds.start, bounds.end);
  const lines = block.split('\n');
  const nextBlock = lines.map((line, index) => (line ? `${prefixForLine(index)}${stripLinePrefix(line)}` : line)).join('\n');
  const nextMarkdown = `${markdown.slice(0, bounds.start)}${nextBlock}${markdown.slice(bounds.end)}`;

  return {
    markdown: nextMarkdown,
    selectionStart: bounds.start,
    selectionEnd: bounds.start + nextBlock.length,
  };
}

function getSelectedLineBounds(markdown: string, selection: MarkdownEditorSelection): MarkdownEditorSelection {
  const start = markdown.lastIndexOf('\n', Math.max(0, selection.start - 1)) + 1;
  const selectedEnd = selection.end > selection.start ? selection.end : selection.start;
  const nextLineBreak = markdown.indexOf('\n', selectedEnd);
  const end = nextLineBreak === -1 ? markdown.length : nextLineBreak;

  return { start, end };
}

function stripLinePrefix(line: string): string {
  return line.replace(/^(?:#{1,6}\s+|>\s+|[-*]\s+|\d+\.\s+)/, '');
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
