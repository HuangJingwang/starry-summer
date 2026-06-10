import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ContentController } from './content.controller';

describe('ContentController', () => {
  const contentService = {
    listPublic: vi.fn(),
  };

  beforeEach(() => {
    contentService.listPublic.mockReset();
  });

  test('normalizes public content list filters', () => {
    const controller = new ContentController(contentService as never);

    controller.listPublic('note', 'popular', ' cloud search ');

    expect(contentService.listPublic).toHaveBeenCalledWith({
      type: 'note',
      sort: 'popular',
      query: 'cloud search',
    });
  });

  test('rejects unsupported public content types', () => {
    const controller = new ContentController(contentService as never);

    expect(() => controller.listPublic('essay', undefined, undefined)).toThrow('Unsupported content type: essay');
    expect(contentService.listPublic).not.toHaveBeenCalled();
  });

  test('rejects unsupported public content sort modes', () => {
    const controller = new ContentController(contentService as never);

    expect(() => controller.listPublic(undefined, 'oldest', undefined)).toThrow('Unsupported content sort: oldest');
    expect(contentService.listPublic).not.toHaveBeenCalled();
  });
});
