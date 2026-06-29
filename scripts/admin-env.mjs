import { randomBytes } from 'node:crypto';

const command = process.argv[2];

if (command === 'interaction-secret') {
  console.log(`INTERACTION_HASH_SECRET=${createSecret()}`);
} else {
  fail('Usage: node scripts/admin-env.mjs interaction-secret');
}

function createSecret() {
  return randomBytes(32).toString('base64url');
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
