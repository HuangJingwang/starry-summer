import type { AdminContentFilters, AdminContentItemLoadResult, AdminContentLoadResult } from './admin-content-types';
import { filterAdminContent } from './admin-content-dashboard';
import { readRepositoryContentFile } from './public-content';

export interface RepositoryAdminContentLoadOptions {
  contentFilePath?: string;
  filters?: AdminContentFilters;
}

export async function loadRepositoryAdminContentItems(
  options: RepositoryAdminContentLoadOptions = {},
): Promise<AdminContentLoadResult> {
  try {
    const items = readRepositoryContentFile(options.contentFilePath);

    return {
      source: 'repository-file',
      items: options.filters ? filterAdminContent(items, options.filters) : items,
    };
  } catch {
    return {
      source: 'fallback',
      items: [],
    };
  }
}

export async function loadRepositoryAdminContentItem(
  id: string,
  options: Pick<RepositoryAdminContentLoadOptions, 'contentFilePath'> = {},
): Promise<AdminContentItemLoadResult> {
  try {
    const item = readRepositoryContentFile(options.contentFilePath).find((contentItem) => contentItem.id === id) ?? null;

    return {
      source: item ? 'repository-file' : 'fallback',
      item,
    };
  } catch {
    return {
      source: 'fallback',
      item: null,
    };
  }
}
