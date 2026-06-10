import { timingSafeEqual, randomBytes, scryptSync } from 'node:crypto';

const SCRYPT_COST = 16_384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const KEY_LENGTH = 64;

export function createPasswordHash(password: string, salt = randomBytes(16).toString('hex')): string {
  const hash = scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
  }).toString('hex');

  return [
    'scrypt',
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt,
    hash,
  ].join(':');
}

export function createPasswordHashCliOutput(password: string, salt?: string): string {
  const trimmed = password.trim();

  if (!trimmed) {
    throw new Error('Password is required');
  }

  return `ADMIN_PASSWORD_HASH=${createPasswordHash(trimmed, salt)}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [algorithm, cost, blockSize, parallelization, salt, expected] = storedHash.split(':');

  if (algorithm !== 'scrypt' || !cost || !blockSize || !parallelization || !salt || !expected) {
    return false;
  }

  const actual = scryptSync(password, salt, KEY_LENGTH, {
    N: Number(cost),
    r: Number(blockSize),
    p: Number(parallelization),
  });
  const expectedBuffer = Buffer.from(expected, 'hex');

  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}
