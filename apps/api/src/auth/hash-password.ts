import { createPasswordHashCliOutput } from './password.js';

const password = process.argv.slice(2).join(' ');

try {
  console.log(createPasswordHashCliOutput(password));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Failed to create password hash');
  process.exitCode = 1;
}
