export type TaxonomyType = 'category' | 'tag' | 'series';

export interface TaxonomyPayload {
  name: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
}

export interface TaxonomyRequest {
  url: string;
  init: RequestInit;
}

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
    sortOrder: sortOrderText ? Number(sortOrderText) : 0,
  });
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
