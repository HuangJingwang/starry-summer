import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const forbiddenPublicIdentityPatterns = [
  'OWNER_REAL_NAME',
  'LEGACY_OWNER_NAME',
];

const publicFilePatterns = [
  /^apps\/web\/content\//,
  /^apps\/web\/src\/app\//,
  /^apps\/web\/src\/components\//,
  /^apps\/web\/src\/lib\//,
  /^packages\/shared\/src\//,
  /^docs\//,
  /^README\.md$/,
];

const allowedBinaryExtensions = /\.(png|jpe?g|gif|webp|ico|pdf)$/i;

export function findPublicIdentityViolations(files, patterns = forbiddenPublicIdentityPatterns) {
  const violations = [];

  for (const file of files) {
    for (const pattern of patterns) {
      if (file.source.includes(pattern)) {
        violations.push({ file: file.file, pattern });
      }
    }
  }

  return violations;
}

export function listTrackedPublicFiles() {
  return execFileSync('git', ['ls-files'], { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((file) => publicFilePatterns.some((pattern) => pattern.test(file)))
    .filter((file) => !allowedBinaryExtensions.test(file));
}

export function readExistingFiles(files) {
  return files
    .filter((file) => existsSync(file))
    .map((file) => ({
      file,
      source: readFileSync(file, 'utf8'),
    }));
}

export function runPublicIdentityGuard() {
  const violations = findPublicIdentityViolations(readExistingFiles(listTrackedPublicFiles()));

  if (violations.length > 0) {
    for (const violation of violations) {
      console.error(`Public identity violation: ${violation.file} contains ${violation.pattern}`);
    }

    return 1;
  }

  console.log('Public identity guard passed');
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(runPublicIdentityGuard());
}
