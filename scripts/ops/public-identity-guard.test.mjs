import assert from 'node:assert/strict';

import { findPublicIdentityViolations } from './public-identity-guard.mjs';

const cleanFiles = [
  {
    file: 'apps/web/content/site-settings.json',
    source: JSON.stringify({ ownerName: 'Aster.H', description: '个人内容平台' }),
  },
  {
    file: 'apps/web/src/app/page.tsx',
    source: '<h1>Aster.H</h1>',
  },
];

const leakingFiles = [
  {
    file: 'apps/web/content/site-settings.json',
    source: JSON.stringify({ ownerName: 'OWNER_REAL_NAME' }),
  },
  {
    file: 'apps/web/src/app/rss.xml',
    source: '<author>LEGACY_OWNER_NAME</author>',
  },
];

assert.deepEqual(findPublicIdentityViolations(cleanFiles), []);

assert.deepEqual(findPublicIdentityViolations(leakingFiles), [
  {
    file: 'apps/web/content/site-settings.json',
    pattern: 'OWNER_REAL_NAME',
  },
  {
    file: 'apps/web/src/app/rss.xml',
    pattern: 'LEGACY_OWNER_NAME',
  },
]);

console.log('public identity guard tests passed');
