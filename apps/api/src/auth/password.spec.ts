import { describe, expect, test } from 'vitest';

import { createPasswordHash, verifyPassword } from './password';

describe('password hashing', () => {
  test('verifies the original password against a scrypt hash', () => {
    const hash = createPasswordHash('correct horse battery staple', 'fixed-salt-for-test');

    expect(verifyPassword('correct horse battery staple', hash)).toBe(true);
    expect(verifyPassword('wrong password', hash)).toBe(false);
  });

  test('rejects unsupported hash formats', () => {
    expect(verifyPassword('password', 'plain-text-password')).toBe(false);
  });
});
