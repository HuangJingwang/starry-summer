interface UpstreamApiHealth {
  status?: string;
  service?: string;
}

export async function GET(): Promise<Response> {
  const api = await checkApiHealth(process.env.API_BASE_URL);
  const status = api?.status === 'degraded' ? 'degraded' : 'ok';

  return Response.json({
    status,
    service: 'starry-summer-web',
    release: {
      version: process.env.RELEASE_VERSION ?? 'development',
      revision: process.env.GIT_REVISION ?? 'unknown',
    },
    ...(api ? { components: { api } } : {}),
  }, { status: status === 'ok' ? 200 : 503 });
}

async function checkApiHealth(apiBaseUrl: string | undefined): Promise<{
  status: 'ok' | 'degraded';
  upstreamStatus?: number;
  message?: string;
} | undefined> {
  if (!apiBaseUrl) {
    return undefined;
  }

  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/health`, { cache: 'no-store' });
    const body = (await response.json().catch(() => ({}))) as UpstreamApiHealth;
    const ok = response.ok && body.status === 'ok' && body.service === 'starry-summer-api';

    return {
      status: ok ? 'ok' : 'degraded',
      upstreamStatus: response.status,
      ...(!ok ? { message: 'API health check is not ok' } : {}),
    };
  } catch (error) {
    return {
      status: 'degraded',
      message: error instanceof Error ? error.message : 'API health check failed',
    };
  }
}
