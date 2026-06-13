import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('search page source', () => {
  test('renders scoped search filters and result previews', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/search/page.tsx'), 'utf8');

    expect(source).toContain('normalizeSearchContentKind');
    expect(source).toContain('buildSearchResultPreviews');
    expect(source).toContain('className="search-scope-tabs"');
    expect(source).toContain('aria-label="搜索范围"');
    expect(source).toContain('className="search-result-list"');
    expect(source).toContain('className="search-result-snippet"');
    expect(source).toContain('className="search-hit-field"');
    expect(source).toContain('name="q" type="search"');
    expect(source).toContain('enterKeyHint="search"');
    expect(source).toContain('<SearchHighlight');
  });

  test('announces search controls, result counts, and empty states accessibly', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/search/page.tsx'), 'utf8');

    expect(source).toContain('<form className="search-form" action="/search" role="search" aria-label="站内搜索">');
    expect(source).toContain('<p className="search-summary" role="status" aria-live="polite">');
    expect(source).toContain('<p className="empty-state" role="status" aria-live="polite">输入关键词后开始搜索。</p>');
    expect(source).toContain('<p className="empty-state" role="status" aria-live="polite">没有找到匹配内容。</p>');
  });

  test('shows a clear empty state before visitors search', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/search/page.tsx'), 'utf8');

    expect(source).toContain('输入关键词后开始搜索。');
    expect(source).toContain('!query ? (');
    expect(source).toContain('query && previews.length === 0 ? (');
    expect(source).toContain('previews.length > 0 ? (');
  });

  test('omits the default all scope from submitted search URLs', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/search/page.tsx'), 'utf8');

    expect(source).toContain("scope !== 'all' ? (");
    expect(source).toContain('<input name="type" type="hidden" value={scope} />');
    expect(source).not.toContain('<input name="type" type="hidden" value={scope} />\n          <button type="submit">搜索</button>');
  });
});
