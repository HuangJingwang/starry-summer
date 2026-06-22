import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { runProductionSmoke } from './production-smoke.mjs';

const server = createServer((request, response) => {
  if (request.url === '/broken') {
    response.writeHead(500, { 'content-type': 'text/html; charset=utf-8' });
    response.end('<h1>Internal Server Error</h1>');
    return;
  }

  if (request.url === '/platform-error') {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end('<main>Application error: a client-side exception has occurred</main>');
    return;
  }

  if (request.url === '/posts') {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end('<main>文章归档</main>');
    return;
  }

  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end('<main>Starry Summer by Aster.H</main>');
});

await new Promise((resolve) => {
  server.listen(0, '127.0.0.1', resolve);
});

try {
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const healthy = await runProductionSmoke({
    baseUrl,
    routes: ['/', '/leetcode', '/posts'],
  });

  assert.deepEqual(healthy.failures, []);
  assert.equal(healthy.results.length, 3);

  const unhealthy = await runProductionSmoke({
    baseUrl,
    routes: ['/broken', '/platform-error'],
  });

  assert.equal(unhealthy.failures.length, 2);
  assert.deepEqual(
    unhealthy.failures.map((failure) => failure.route),
    ['/broken', '/platform-error'],
  );
} finally {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

console.log('production smoke tests passed');
