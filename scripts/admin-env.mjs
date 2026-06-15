import { randomBytes, scryptSync } from 'node:crypto';

const keyLength = 64;
const command = process.argv[2];
const value = process.argv[3] ?? '';

if (command === 'hash-password') {
  const password = value.trim();

  if (!password) {
    fail('Usage: node scripts/admin-env.mjs hash-password "your admin password"');
  }

  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, keyLength, {
    N: 16_384,
    r: 8,
    p: 1,
  }).toString('hex');

  console.log(`ADMIN_PASSWORD_HASH=scrypt:16384:8:1:${salt}:${hash}`);
} else if (command === 'session-secret') {
  console.log(`SESSION_SECRET=${createSecret()}`);
} else if (command === 'interaction-secret') {
  console.log(`INTERACTION_HASH_SECRET=${createSecret()}`);
} else {
  fail('Usage: node scripts/admin-env.mjs <hash-password|session-secret|interaction-secret>');
}

function createSecret() {
  return randomBytes(32).toString('base64url');
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
