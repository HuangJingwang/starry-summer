import { MODULE_METADATA } from '@nestjs/common/constants';
import { describe, expect, test } from 'vitest';

import { SecurityModule } from '../security/security.module';
import { AuthModule } from './auth.module';
import { LoginRateLimitGuard } from './login-rate-limit.guard';

describe('AuthModule', () => {
  test('imports rate limit providers for login protection', () => {
    expect(Reflect.getMetadata(MODULE_METADATA.IMPORTS, AuthModule)).toContain(SecurityModule);
  });

  test('provides the login rate limit guard', () => {
    expect(Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AuthModule)).toContain(LoginRateLimitGuard);
  });
});
