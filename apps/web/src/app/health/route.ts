export function GET(): Response {
  return Response.json({
    status: 'ok',
    service: 'starry-summer-web',
    release: {
      version: process.env.RELEASE_VERSION ?? 'development',
      revision: process.env.GIT_REVISION ?? 'unknown',
    },
  });
}
