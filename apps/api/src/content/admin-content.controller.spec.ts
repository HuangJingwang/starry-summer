import { HEADERS_METADATA } from '@nestjs/common/constants';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AdminContentController } from './admin-content.controller';

describe('AdminContentController', () => {
  const contentService = {
    listAdmin: vi.fn(),
  };

  beforeEach(() => {
    contentService.listAdmin.mockReset();
  });

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

  test('normalizes admin content list query filters', () => {
    const controller = new AdminContentController(contentService as never);

    controller.listAdmin('post', 'private', ' lab ');

    expect(contentService.listAdmin).toHaveBeenCalledWith({
      type: 'post',
      status: 'private',
      query: 'lab',
    });
  });

  test('rejects unsupported admin content types', () => {
    const controller = new AdminContentController(contentService as never);

    expect(() => controller.listAdmin('essay', undefined, undefined)).toThrow('Unsupported content type: essay');
    expect(contentService.listAdmin).not.toHaveBeenCalled();
  });

  test('rejects unsupported admin content statuses', () => {
    const controller = new AdminContentController(contentService as never);

    expect(() => controller.listAdmin(undefined, 'reviewing', undefined)).toThrow('Unsupported content status: reviewing');
    expect(contentService.listAdmin).not.toHaveBeenCalled();
  });
});
