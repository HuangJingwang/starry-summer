export interface Env {
  DB: D1Database;
  ALLOWED_ORIGIN?: string;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

type SubmissionResource = 'comments' | 'guestbook';

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return withCors(new Response(null, { status: 204 }), request, env);
    }

    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);

    try {
      if (request.method === 'POST' && (segments[0] === 'likes' || segments[0] === 'views') && segments.length === 3) {
        return withCors(await incrementCounter(env, segments[0] === 'likes' ? 'like' : 'view', segments[1], segments[2]), request, env);
      }

      if (request.method === 'GET' && segments[0] === 'comments' && segments.length === 3) {
        return withCors(await listApprovedComments(env, segments[1], segments[2]), request, env);
      }

      if (request.method === 'POST' && segments[0] === 'comments' && segments.length === 1) {
        return withCors(await createSubmission(env, 'comments', await request.json(), request), request, env);
      }

      if (request.method === 'GET' && segments[0] === 'guestbook' && segments.length === 1) {
        return withCors(await listApprovedGuestbook(env), request, env);
      }

      if (request.method === 'POST' && segments[0] === 'guestbook' && segments.length === 1) {
        return withCors(await createSubmission(env, 'guestbook', await request.json(), request), request, env);
      }

      if (segments[0] === 'admin' && (segments[1] === 'comments' || segments[1] === 'guestbook')) {
        return withCors(await handleAdminRequest(env, request, segments as [string, SubmissionResource, ...string[]]), request, env);
      }

      return withCors(Response.json({ message: 'Not found' }, { status: 404 }), request, env);
    } catch {
      return withCors(Response.json({ message: 'Interaction worker error' }, { status: 500 }), request, env);
    }
  },
};

async function incrementCounter(env: Env, kind: 'like' | 'view', targetType = '', targetId = ''): Promise<Response> {
  const now = new Date().toISOString();

  await env.DB.prepare(
    `
      insert into interaction_counters (target_type, target_id, kind, count, updated_at)
      values (?, ?, ?, 1, ?)
      on conflict(target_type, target_id, kind)
      do update set count = count + 1, updated_at = excluded.updated_at
    `,
  ).bind(targetType, targetId, kind, now).run();

  const row = await env.DB.prepare(
    'select count from interaction_counters where target_type = ? and target_id = ? and kind = ?',
  ).bind(targetType, targetId, kind).first<{ count: number }>();

  return new Response(String(row?.count ?? 1), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

async function listApprovedComments(env: Env, targetType = '', targetId = ''): Promise<Response> {
  const rows = await env.DB.prepare(
    `
      select id, author_name as authorName, body, created_at as createdAt, anchor_json as anchorJson
      from public_submissions
      where resource = 'comments' and status = 'approved' and target_type = ? and target_id = ?
      order by created_at asc
    `,
  ).bind(targetType, targetId).all<{ id: string; authorName: string; body: string; createdAt: string; anchorJson?: string }>();

  return Response.json(rows.results.map(normalizePublicSubmissionRow), { headers: jsonHeaders });
}

async function listApprovedGuestbook(env: Env): Promise<Response> {
  const rows = await env.DB.prepare(
    `
      select id, author_name as authorName, body, created_at as createdAt, anchor_json as anchorJson
      from public_submissions
      where resource = 'guestbook' and status = 'approved'
      order by created_at desc
    `,
  ).all<{ id: string; authorName: string; body: string; createdAt: string; anchorJson?: string }>();

  return Response.json(rows.results.map(normalizePublicSubmissionRow), { headers: jsonHeaders });
}

async function createSubmission(env: Env, resource: SubmissionResource, input: unknown, request: Request): Promise<Response> {
  const body = typeof input === 'object' && input ? String((input as { body?: unknown }).body ?? '').trim() : '';

  if (!body) {
    return Response.json({ message: 'Body is required' }, { status: 400 });
  }

  const targetType = resource === 'comments' ? String((input as { targetType?: unknown }).targetType ?? '') : '';
  const targetId = resource === 'comments' ? String((input as { targetId?: unknown }).targetId ?? '') : '';
  const anchor = typeof input === 'object' && input ? (input as { anchor?: unknown }).anchor : undefined;
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await env.DB.prepare(
    `
      insert into public_submissions
        (id, resource, target_type, target_id, author_name, body, status, anchor_json, user_agent, created_at, updated_at)
      values (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
    `,
  ).bind(
    id,
    resource,
    targetType || null,
    targetId || null,
    'Reader',
    body,
    anchor ? JSON.stringify(anchor) : null,
    request.headers.get('user-agent') ?? '',
    now,
    now,
  ).run();

  return Response.json({ id, status: 'pending' }, { status: 202, headers: jsonHeaders });
}

async function handleAdminRequest(
  env: Env,
  request: Request,
  segments: [string, SubmissionResource, ...string[]],
): Promise<Response> {
  const resource = segments[1];
  const id = segments[2];

  if (request.method === 'GET' && !id) {
    const status = new URL(request.url).searchParams.get('status') || 'pending';
    const rows = await env.DB.prepare(
      `
        select id, author_name as authorName, body, status, created_at as createdAt, target_type as targetType, target_id as targetId, user_agent as userAgent, anchor_json as anchorJson
        from public_submissions
        where resource = ? and status = ?
        order by created_at desc
      `,
    ).bind(resource, status).all<Record<string, unknown>>();

    return Response.json(rows.results.map(normalizePublicSubmissionRow), { headers: jsonHeaders });
  }

  if (request.method === 'PATCH' && id && segments[3] === 'moderate') {
    const input = await request.json() as { status?: unknown };
    const status = input.status === 'approved' || input.status === 'rejected' ? input.status : 'pending';

    await env.DB.prepare(
      'update public_submissions set status = ?, updated_at = ? where resource = ? and id = ?',
    ).bind(status, new Date().toISOString(), resource, id).run();

    return Response.json({ id, status }, { headers: jsonHeaders });
  }

  if (request.method === 'DELETE' && id) {
    await env.DB.prepare('delete from public_submissions where resource = ? and id = ?').bind(resource, id).run();

    return new Response(null, { status: 204 });
  }

  return Response.json({ message: 'Not found' }, { status: 404 });
}

function normalizePublicSubmissionRow(row: Record<string, unknown>) {
  const anchorJson = typeof row.anchorJson === 'string' ? row.anchorJson : '';

  return {
    ...row,
    ...(anchorJson ? { anchor: safeJsonParse(anchorJson) } : {}),
    anchorJson: undefined,
  };
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function withCors(response: Response, request: Request, env: Env): Response {
  const origin = request.headers.get('origin') ?? '';
  const allowedOrigin = env.ALLOWED_ORIGIN || origin || '*';
  const headers = new Headers(response.headers);

  headers.set('access-control-allow-origin', allowedOrigin);
  headers.set('access-control-allow-methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  headers.set('access-control-allow-headers', 'content-type');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
