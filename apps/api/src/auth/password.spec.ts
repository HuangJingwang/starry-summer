import { describe, expect, test } from 'vitest';

import { createPasswordHash, createPasswordHashCliOutput, createSessionSecretCliOutput, verifyPassword } from './password';

describe('password hashing', () => {
  test('verifies the original password against a scrypt hash', () => {
    const hash = createPasswordHash('correct horse battery staple', 'fixed-salt-for-test');

    expect(verifyPassword('correct horse battery staple', hash)).toBe(true);
    expect(verifyPassword('wrong password', hash)).toBe(false);
  });

  test('rejects unsupported hash formats', () => {
    expect(verifyPassword('password', 'plain-text-password')).toBe(false);
  });

  test('creates CLI output that can be pasted into ADMIN_PASSWORD_HASH', () => {
    const output = createPasswordHashCliOutput('deploy-password', 'deploy-salt');

    expect(output).toMatch(/^ADMIN_PASSWORD_HASH=scrypt:/);
    expect(verifyPassword('deploy-password', output.replace('ADMIN_PASSWORD_HASH=', ''))).toBe(true);
  });

  test('rejects blank CLI passwords', () => {
    expect(() => createPasswordHashCliOutput('   ')).toThrow('Password is required');
  });

  test('creates CLI output for SESSION_SECRET', () => {
    expect(createSessionSecretCliOutput('fixed-secret-bytes')).toBe(
      'SESSION_SECRET=Zml4ZWQtc2VjcmV0LWJ5dGVz',
    );
    expect(createSessionSecretCliOutput()).toMatch(/^SESSION_SECRET=[A-Za-z0-9_-]{43}$/);
  });
});
