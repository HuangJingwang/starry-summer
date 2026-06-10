import { HEADERS_METADATA } from '@nestjs/common/constants';
import { describe, expect, test } from 'vitest';

import { AdminContentController } from './admin-content.controller';

describe('AdminContentController', () => {
  test('serves Markdown exports as downloadable files', () => {
    expect(Reflect.getMetadata(HEADERS_METADATA, AdminContentController.prototype.exportMarkdownArchive)).toEqual(expect.arrayContaining([
      { name: 'Content-Type', value: 'text/markdown; charset=utf-8' },
      { name: 'Content-Disposition', value: 'attachment; filename="starry-summer-export-all.md"' },
    ]));

    expect(Reflect.getMetadata(HEADERS_METADATA, AdminContentController.prototype.exportMarkdown)).toEqual(expect.arrayContaining([
      { name: 'Content-Type', value: 'text/markdown; charset=utf-8' },
      { name: 'Content-Disposition', value: 'attachment; filename="starry-summer-export.md"' },
    ]));
  });
});
