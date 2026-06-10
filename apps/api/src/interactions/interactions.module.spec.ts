import { MODULE_METADATA } from '@nestjs/common/constants';
import { describe, expect, test } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import { ContentModule } from '../content/content.module';
import { InteractionsModule } from './interactions.module';

describe('InteractionsModule', () => {
  test('imports auth providers for admin moderation guards', () => {
    expect(Reflect.getMetadata(MODULE_METADATA.IMPORTS, InteractionsModule)).toContain(AuthModule);
  });

  test('imports content providers for comment target policy checks', () => {
    expect(Reflect.getMetadata(MODULE_METADATA.IMPORTS, InteractionsModule)).toContain(ContentModule);
  });
});
