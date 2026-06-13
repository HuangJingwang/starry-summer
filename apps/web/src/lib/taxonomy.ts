export type TaxonomyType = 'category' | 'tag' | 'series';

export interface TaxonomyPayload {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface TaxonomyTerm {
  id: string;
  type: TaxonomyType;
  name: string;
  slug: string;
  description: string;
  parentId?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type TaxonomyTermGroups = Record<TaxonomyType, TaxonomyTerm[]>;

export type RawTaxonomyTerm = Partial<Omit<TaxonomyTerm, 'description' | 'sortOrder'>> & {
  id: string;
  type: TaxonomyType;
  description?: string | null;
  parentId?: string | null;
  sortOrder?: number | null;
};

export interface TaxonomyRequest {
  url: string;
  init: RequestInit;
}

const taxonomyTypes: TaxonomyType[] = ['category', 'tag', 'series'];

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizePayload(input: TaxonomyPayload): TaxonomyPayload {
  return {
    name: input.name.trim(),
    slug: input.slug ? normalizeSlug(input.slug) : undefined,
    description: input.description?.trim(),
    parentId: input.parentId?.trim() || undefined,
    sortOrder: input.sortOrder,
  };
}

function jsonRequest(url: string, method: 'POST' | 'PATCH', payload: TaxonomyPayload): TaxonomyRequest {
  return {
    url,
    init: {
      method,
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(normalizePayload(payload)),
    },
  };
}

function formText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '');
}

export function buildTaxonomyPayloadFromFormData(formData: FormData): TaxonomyPayload {
  const sortOrderText = formText(formData, 'sortOrder').trim();

  return normalizePayload({
    name: formText(formData, 'name'),
    slug: formText(formData, 'slug'),
    description: formText(formData, 'description'),
    parentId: formText(formData, 'parentId'),
    sortOrder: sortOrderText ? Number(sortOrderText) : 0,
  });
}

export function normalizeTaxonomyTerm(input: RawTaxonomyTerm): TaxonomyTerm {
  return {
    id: input.id,
    type: input.type,
    name: input.name ?? '',
    slug: input.slug ?? '',
    description: input.description ?? '',
    ...(input.parentId ? { parentId: input.parentId } : {}),
    sortOrder: input.sortOrder ?? 0,
    createdAt: input.createdAt ?? '',
    updatedAt: input.updatedAt ?? '',
  };
}

export function groupTaxonomyTermsByType(terms: TaxonomyTerm[]): TaxonomyTermGroups {
  const groups: TaxonomyTermGroups = {
    category: [],
    tag: [],
    series: [],
  };

  for (const term of terms) {
    groups[term.type].push(term);
  }

  return groups;
}

export function buildListTaxonomyTermsRequest(type: TaxonomyType): TaxonomyRequest {
  return {
    url: `/api/admin/taxonomy/${type}`,
    init: {
      method: 'GET',
      credentials: 'include',
    },
  };
}

export function buildCreateTaxonomyTermRequest(type: TaxonomyType, payload: TaxonomyPayload): TaxonomyRequest {
  return jsonRequest(`/api/admin/taxonomy/${type}`, 'POST', payload);
}

export function buildUpdateTaxonomyTermRequest(type: TaxonomyType, id: string, payload: TaxonomyPayload): TaxonomyRequest {
  return jsonRequest(`/api/admin/taxonomy/${type}/${id}`, 'PATCH', payload);
}

export function buildDeleteTaxonomyTermRequest(type: TaxonomyType, id: string): TaxonomyRequest {
  return {
    url: `/api/admin/taxonomy/${type}/${id}`,
    init: {
      method: 'DELETE',
      credentials: 'include',
    },
  };
}

export async function readTaxonomyErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const data = (await response.json()) as { message?: unknown; error?: unknown };
      const message = normalizeTaxonomyErrorMessage(data.message) || normalizeTaxonomyErrorMessage(data.error);

      return message || fallback;
    }

    const text = (await response.text()).trim();

    return text || fallback;
  } catch {
    return fallback;
  }
}

function normalizeTaxonomyErrorMessage(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).join('；');
  }

  return '';
}
