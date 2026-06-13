import { afterEach, describe, expect, test, vi } from 'vitest';

import { resolvePublicClientAddress, resolvePublicUserAgent } from './public-client';

describe('public client identity helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('ignores forwarded client headers unless proxy trust is enabled', () => {
    expect(
      resolvePublicClientAddress({
        headers: {
          'x-forwarded-for': '198.51.100.42, 203.0.113.10',
          'x-real-ip': '203.0.113.200',
        },
        ip: '127.0.0.1',
      }),
    ).toBe('127.0.0.1');
  });

  test('resolves the original forwarded client address when proxy trust is enabled', () => {
    expect(
      resolvePublicClientAddress({
        headers: {
          'x-forwarded-for': '198.51.100.42, 203.0.113.10',
          'x-real-ip': '203.0.113.200',
        },
        ip: '127.0.0.1',
      }, { trustProxy: true }),
    ).toBe('198.51.100.42');
  });

  test('falls back to real ip request ip and socket address', () => {
    expect(resolvePublicClientAddress({ headers: { 'x-real-ip': '198.51.100.7' } }, { trustProxy: true })).toBe('198.51.100.7');
    expect(resolvePublicClientAddress({ headers: {}, ip: '127.0.0.1' })).toBe('127.0.0.1');
    expect(resolvePublicClientAddress({ headers: {}, socket: { remoteAddress: '10.0.0.2' } })).toBe('10.0.0.2');
    expect(resolvePublicClientAddress({ headers: {} })).toBe('unknown-ip');
  });

  test('can enable proxy trust from the runtime environment', () => {
    vi.stubEnv('TRUST_PROXY', 'true');

    expect(
      resolvePublicClientAddress({
        headers: {
          'x-forwarded-for': '198.51.100.42, 203.0.113.10',
        },
        ip: '127.0.0.1',
      }),
    ).toBe('198.51.100.42');
  });

  test('normalizes public user agent values', () => {
    expect(resolvePublicUserAgent({ headers: { 'user-agent': ' Safari ' } })).toBe('Safari');
    expect(resolvePublicUserAgent({ headers: {} })).toBe('unknown-agent');
    expect(resolvePublicUserAgent({ headers: { 'user-agent': 'a'.repeat(600) } })).toHaveLength(500);
  });
});
