import { fileURLToPath } from 'node:url';

const defaultRoutes = [
  '/',
  '/leetcode',
  '/posts',
  '/notes',
  '/moments',
  '/projects',
  '/archives',
  '/search',
  '/guestbook',
  '/about',
  '/rss.xml',
  '/sitemap.xml',
];

const routesRequiringOwnerDisplay = new Set(['/', '/about']);

const obviousErrorPatterns = [
  /Application error/i,
  /Internal Server Error/i,
  /This Serverless Function has crashed/i,
  /DEPLOYMENT_NOT_FOUND/i,
  /FUNCTION_INVOCATION_FAILED/i,
  /The page could not be found/i,
];

export async function runProductionSmoke({
  baseUrl = 'https://www.asterh.me',
  routes = defaultRoutes,
  fetcher = fetch,
} = {}) {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
  const results = [];
  const failures = [];

  for (const route of routes) {
    const url = `${normalizedBaseUrl}${route}`;

    try {
      const response = await fetcher(url, {
        headers: {
          'user-agent': 'starry-summer-production-smoke/1.0',
        },
      });
      const body = await response.text();
      const errors = [];

      if (!response.ok) {
        errors.push(`HTTP ${response.status}`);
      }

      const matchedErrorPattern = obviousErrorPatterns.find((pattern) => pattern.test(body));

      if (matchedErrorPattern) {
        errors.push(`matched error pattern ${matchedErrorPattern}`);
      }

      if (routesRequiringOwnerDisplay.has(route) && !body.includes('Aster.H')) {
        errors.push('missing public owner display Aster.H');
      }

      const result = {
        route,
        status: response.status,
        ok: errors.length === 0,
        errors,
      };

      results.push(result);

      if (!result.ok) {
        failures.push(result);
      }
    } catch (error) {
      const result = {
        route,
        status: 0,
        ok: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };

      results.push(result);
      failures.push(result);
    }
  }

  return { baseUrl: normalizedBaseUrl, results, failures };
}

function parseArgs(argv) {
  const args = {
    baseUrl: 'https://www.asterh.me',
    routes: defaultRoutes,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--base-url') {
      args.baseUrl = argv[index + 1] ?? args.baseUrl;
      index += 1;
    } else if (arg === '--routes') {
      args.routes = (argv[index + 1] ?? '')
        .split(',')
        .map((route) => route.trim())
        .filter(Boolean);
      index += 1;
    }
  }

  return args;
}

async function main() {
  const result = await runProductionSmoke(parseArgs(process.argv.slice(2)));

  if (result.failures.length > 0) {
    console.error(`Production smoke failed for ${result.baseUrl}`);

    for (const failure of result.failures) {
      console.error(`${failure.route}: ${failure.errors.join('; ')}`);
    }

    return 1;
  }

  console.log(`Production smoke passed for ${result.baseUrl}`);

  for (const check of result.results) {
    console.log(`${check.route}: HTTP ${check.status}`);
  }

  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(await main());
}
