import type { ContentVisibility } from '@starry-summer/shared';

import type { SiteContentItem } from './content';
import {
  normalizeAdminContentItem,
  normalizeContentPayload,
  validContentVisibility,
} from './admin-content-normalize';
import type {
  AdminContentAction,
  AdminContentBulkAction,
  AdminContentApiRecord,
  AdminContentFetcher,
  AdminContentItemLoadResult,
  AdminContentLoadResult,
  AdminContentPayload,
  AdminContentRequest,
  AdminContentRequestOptions,
  AdminContentSearchParams,
  AdminMarkdownArchiveImportPayload,
  AdminMarkdownImportPayload,
} from './admin-content-types';

function withAdminRequestOptions(path: string, options: AdminContentRequestOptions = {}): Pick<AdminContentRequest, 'url'> & {
  headers?: HeadersInit;
} {
  const headers = options.cookieHeader ? { cookie: options.cookieHeader } : undefined;

  if (!options.apiBaseUrl) {
    return {
      url: path,
      headers,
    };
  }

  return {
    url: `${options.apiBaseUrl.replace(/\/$/, '')}${path.replace(/^\/api/, '')}`,
    headers,
  };
}

function appendAdminContentFilters(url: string, filters: AdminContentSearchParams | undefined): string {
  const params = new URLSearchParams();
  const query = filters?.q?.trim();

  if (query) {
    params.set('q', query);
  }

  if (filters?.status) {
    params.set('status', filters.status);
  }

  if (filters?.type) {
    params.set('type', filters.type);
  }

  const category = filters?.category?.trim();
  const tag = filters?.tag?.trim();
  const series = filters?.series?.trim();

  if (category) {
    params.set('category', category);
  }

  if (tag) {
    params.set('tag', tag);
  }

  if (series) {
    params.set('series', series);
  }

  const queryString = params.toString();

  return queryString ? `${url}?${queryString}` : url;
}

function jsonRequest(url: string, method: 'POST' | 'PATCH', input: AdminContentPayload): AdminContentRequest {
  const { visibility: _visibility, ...body } = normalizeContentPayload(input);

  return {
    url,
    init: {
      method,
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  };
}

export function buildCreateDraftRequest(input: AdminContentPayload): AdminContentRequest {
  return jsonRequest('/api/admin/content', 'POST', input);
}

export function buildListAdminContentRequest(options: AdminContentRequestOptions = {}): AdminContentRequest {
  const request = withAdminRequestOptions('/api/admin/content', options);

  return {
    url: appendAdminContentFilters(request.url, options.filters),
    init: {
      method: 'GET',
      credentials: 'include',
      ...(request.headers ? { headers: request.headers } : {}),
    },
  };
}

export function buildGetAdminContentRequest(id: string, options: AdminContentRequestOptions = {}): AdminContentRequest {
  const request = withAdminRequestOptions(`/api/admin/content/${id}`, options);

  return {
    url: request.url,
    init: {
      method: 'GET',
      credentials: 'include',
      ...(request.headers ? { headers: request.headers } : {}),
    },
  };
}

export async function loadAdminContentItems(
  fallbackItems: SiteContentItem[],
  fetcher: AdminContentFetcher = (url, init) => fetch(url, init),
  options: AdminContentRequestOptions = {},
): Promise<AdminContentLoadResult> {
  const request = buildListAdminContentRequest(options);

  try {
    const response = await fetcher(request.url, request.init);

    if (!response.ok) {
      return { source: 'fallback', items: fallbackItems };
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return { source: 'fallback', items: fallbackItems };
    }

    return {
      source: 'api',
      items: data.map((item) => normalizeAdminContentItem(item as AdminContentApiRecord)),
    };
  } catch {
    return { source: 'fallback', items: fallbackItems };
  }
}

export async function loadAdminContentItem(
  id: string,
  fallbackItems: SiteContentItem[],
  fetcher: AdminContentFetcher = (url, init) => fetch(url, init),
  options: AdminContentRequestOptions = {},
): Promise<AdminContentItemLoadResult> {
  const request = buildGetAdminContentRequest(id, options);
  const fallback = fallbackItems.find((item) => item.id === id) ?? null;

  try {
    const response = await fetcher(request.url, request.init);

    if (!response.ok) {
      return { source: 'fallback', item: fallback };
    }

    const data: unknown = await response.json();

    if (!data || typeof data !== 'object') {
      return { source: 'fallback', item: fallback };
    }

    return {
      source: 'api',
      item: normalizeAdminContentItem(data as AdminContentApiRecord),
    };
  } catch {
    return { source: 'fallback', item: fallback };
  }
}

export function buildUpdateContentRequest(id: string, input: AdminContentPayload): AdminContentRequest {
  return jsonRequest(`/api/admin/content/${id}`, 'PATCH', input);
}

export function buildAdminContentActionRequest(id: string, action: AdminContentAction): AdminContentRequest {
  return {
    url: `/api/admin/content/${id}/${action}`,
    init: {
      method: 'PATCH',
      credentials: 'include',
    },
  };
}

export function buildAdminContentBulkActionRequests(ids: string[], action: AdminContentBulkAction): AdminContentRequest[] {
  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];

  return uniqueIds.map((id) => {
    if (action === 'private' || action === 'public') {
      return buildSetContentVisibilityRequest(id, action);
    }

    return buildAdminContentActionRequest(id, action);
  });
}

export function buildDeleteContentRequest(id: string): AdminContentRequest {
  return {
    url: `/api/admin/content/${id}`,
    init: {
      method: 'DELETE',
      credentials: 'include',
    },
  };
}

export function buildSetContentVisibilityRequest(id: string, visibility: ContentVisibility): AdminContentRequest {
  return {
    url: `/api/admin/content/${id}/visibility`,
    init: {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        visibility: validContentVisibility.has(visibility) ? visibility : 'public',
      }),
    },
  };
}

export async function readAdminContentErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const data = (await response.json()) as { message?: unknown; error?: unknown };
      const message = normalizeAdminContentErrorMessage(data.message) || normalizeAdminContentErrorMessage(data.error);

      return message || fallback;
    }

    const text = (await response.text()).trim();

    return text || fallback;
  } catch {
    return fallback;
  }
}

function normalizeAdminContentErrorMessage(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).join('；');
  }

  return '';
}

export function buildExportMarkdownRequest(id: string): AdminContentRequest {
  return {
    url: `/api/admin/content/${id}/export`,
    init: {
      method: 'GET',
      credentials: 'include',
    },
  };
}

export function buildExportAllMarkdownRequest(): AdminContentRequest {
  return {
    url: '/api/admin/content/export/all',
    init: {
      method: 'GET',
      credentials: 'include',
    },
  };
}

export function buildImportMarkdownRequest(input: AdminMarkdownImportPayload): AdminContentRequest {
  return {
    url: '/api/admin/content/import',
    init: {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        type: input.type,
        markdown: input.markdown,
      }),
    },
  };
}

export function buildImportMarkdownArchiveRequest(input: AdminMarkdownArchiveImportPayload): AdminContentRequest {
  return {
    url: '/api/admin/content/import/archive',
    init: {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        markdown: input.markdown,
      }),
    },
  };
}
