export type ContentStatus = 'draft' | 'published' | 'private' | 'archived';

export type ContentVisibility = 'public' | 'private';

export type ContentType = 'post' | 'note' | 'moment' | 'page' | 'project';

export type ContentSourceType = 'original' | 'repost';

export interface ContentVisibilityInput {
  status: ContentStatus;
  visibility: ContentVisibility;
}

export interface PublishableContentInput {
  title: string;
  slug: string;
  bodyMarkdown: string;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isPublicContent(content: ContentVisibilityInput): boolean {
  return content.status === 'published' && content.visibility === 'public';
}

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export function canPublishContent(content: PublishableContentInput): boolean {
  return (
    content.title.trim().length > 0 &&
    isValidSlug(content.slug) &&
    content.bodyMarkdown.trim().length > 0
  );
}
