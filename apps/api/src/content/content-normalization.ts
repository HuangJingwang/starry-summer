import type { ContentType, ProjectLinks, ProjectMetadata, ProjectStatus } from '@starry-summer/shared';

const contentTypes = new Set<ContentType>(['post', 'note', 'moment', 'page', 'project']);
const projectStatuses = new Set<ProjectStatus>(['active', 'paused', 'completed', 'archived']);
const projectLinkKeys: Array<keyof ProjectLinks> = ['website', 'repository', 'demo', 'article'];
const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === 'string') {
    return value.split(',');
  }

  return [];
}

export function normalizeTaxonomyLabels(labels: string[] | undefined): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const label of labels ?? []) {
    const next = label.trim();
    const key = next.toLowerCase();

    if (next && !seen.has(key)) {
      normalized.push(next);
      seen.add(key);
    }
  }

  return normalized;
}

export function normalizeSourceUrl(value: string | undefined): string {
  return value?.trim() ?? '';
}

export function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized || undefined;
}

export function normalizeNullableOptionalText(value: string | undefined): string | null {
  return normalizeOptionalText(value) ?? null;
}

export function normalizeProjectMetadata(project: ProjectMetadata | undefined): ProjectMetadata | undefined {
  if (!project || typeof project !== 'object') {
    return undefined;
  }

  const normalized: ProjectMetadata = {};
  const status = normalizeProjectStatus(project.status);
  const links = normalizeProjectLinks(project.links);
  const stack = normalizeTaxonomyLabels(project.stack);
  const startedAt = normalizeDateOnly(project.startedAt);
  const endedAt = normalizeDateOnly(project.endedAt);

  if (status) {
    normalized.status = status;
  }

  if (links) {
    normalized.links = links;
  }

  if (stack.length > 0) {
    normalized.stack = stack;
  }

  if (startedAt) {
    normalized.startedAt = startedAt;
  }

  if (endedAt) {
    normalized.endedAt = endedAt;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function parseContentType(value: string | undefined): ContentType {
  if (contentTypes.has(value as ContentType)) {
    return value as ContentType;
  }

  return 'post';
}

export function slugifyContentTitle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeProjectStatus(status: ProjectMetadata['status']): ProjectStatus | undefined {
  return projectStatuses.has(status as ProjectStatus) ? status : undefined;
}

function normalizeProjectLinks(links: ProjectMetadata['links']): ProjectLinks | undefined {
  if (!links || typeof links !== 'object') {
    return undefined;
  }

  const normalized: ProjectLinks = {};

  for (const key of projectLinkKeys) {
    const value = links[key]?.trim();

    if (value) {
      normalized[key] = value;
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeDateOnly(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized && dateOnlyPattern.test(normalized) ? normalized : undefined;
}
