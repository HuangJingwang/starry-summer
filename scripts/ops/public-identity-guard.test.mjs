import assert from 'node:assert/strict';

import { findPublicIdentityViolations } from './public-identity-guard.mjs';

const cleanFiles = [
  {
    file: 'apps/web/content/site-settings.json',
    source: JSON.stringify({
      ownerName: 'Aster.H',
      description: '个人内容平台',
      socialLinks: [{ label: 'GitHub', href: 'https://github.com/HuangJingwang' }],
    }),
  },
  {
    file: 'apps/web/src/app/page.tsx',
    source: '<h1>Aster.H</h1>',
  },
  {
    file: 'apps/web/content/public-content.json',
    source: JSON.stringify({
      bodyMarkdown: '[项目源码](https://github.com/HuangJingwang/brushup)',
    }),
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
