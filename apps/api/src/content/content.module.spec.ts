import { MODULE_METADATA } from '@nestjs/common/constants';
import { describe, expect, test } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import { createDemoContentRecords } from '../demo/demo-data';
import { ContentModule } from './content.module';
import { InMemoryContentRepository } from './content.repository';

describe('ContentModule', () => {
  test('imports auth providers for admin content guards', () => {
    expect(Reflect.getMetadata(MODULE_METADATA.IMPORTS, ContentModule)).toContain(AuthModule);
  });

  test('demo records populate the in-memory content repository with public content types', async () => {
    const repository = new InMemoryContentRepository(undefined, createDemoContentRecords());
    const items = await repository.listPublic();

    expect(items.length).toBeGreaterThanOrEqual(10);
    expect(new Set(items.map((item) => item.type))).toEqual(new Set(['post', 'note', 'moment', 'page', 'project']));
    expect(items.some((item) => item.featured && item.pinned)).toBe(true);
  });
});
