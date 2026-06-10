import { MODULE_METADATA } from '@nestjs/common/constants';
import { describe, expect, test } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import { ContentModule } from './content.module';

describe('ContentModule', () => {
  test('imports auth providers for admin content guards', () => {
    expect(Reflect.getMetadata(MODULE_METADATA.IMPORTS, ContentModule)).toContain(AuthModule);
  });
});
