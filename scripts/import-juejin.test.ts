import assert from 'node:assert/strict';

import { getArticleBodyMarkdown, getExistingJuejinArticleIds } from './import-juejin.ts';

assert.equal(
  getArticleBodyMarkdown({
    mark_content: '## Markdown 正文',
    web_html_content: '<p>不应使用 HTML 兜底</p>',
  }),
  '## Markdown 正文',
);

const htmlBody = getArticleBodyMarkdown({
  mark_content: '',
  web_html_content: '<style>.markdown-body { color: #595959; }</style><h2>背景</h2><p>列表接口提供 HTML 正文。</p>',
});

assert.match(htmlBody, /^## 背景/m);
assert.match(htmlBody, /列表接口提供 HTML 正文。/);

assert.deepEqual(
  getExistingJuejinArticleIds([
    { id: 'juejin-123', slug: 'juejin-123', sourceUrl: 'https://juejin.cn/post/123' },
    { id: 'post-456', slug: 'local-post', sourceUrl: 'https://example.com/post/456' },
    { id: 'post-789', slug: 'juejin-789', sourceUrl: 'https://juejin.cn/post/789' },
  ]),
  new Set(['123', '789']),
);

console.log('Juejin import tests passed');
