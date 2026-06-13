import { MODULE_METADATA } from '@nestjs/common/constants';
import { describe, expect, test } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import { ContentModule } from '../content/content.module';
import { createDemoGuestbookEntries } from '../demo/demo-data';
import { InMemoryInteractionsRepository } from './interactions.repository';
import { InteractionsModule } from './interactions.module';

describe('InteractionsModule', () => {
  test('imports auth providers for admin moderation guards', () => {
    expect(Reflect.getMetadata(MODULE_METADATA.IMPORTS, InteractionsModule)).toContain(AuthModule);
  });

  test('imports content providers for comment target policy checks', () => {
    expect(Reflect.getMetadata(MODULE_METADATA.IMPORTS, InteractionsModule)).toContain(ContentModule);
  });

  test('demo guestbook entries populate the public in-memory guestbook', async () => {
    const repository = new InMemoryInteractionsRepository(undefined, {
      guestbookEntries: createDemoGuestbookEntries(),
    });

    const entries = await repository.listApprovedGuestbookEntries();

    expect(entries).toHaveLength(4);
    expect(entries.map((entry) => entry.status)).toEqual(['approved', 'approved', 'approved', 'approved']);
  });
});
