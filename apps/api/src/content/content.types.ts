import type { ContentSourceType, ContentStatus, ContentType, ContentVisibility, ProjectMetadata } from '@starry-summer/shared';

export interface ContentRecord {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  summary: string;
  seoTitle?: string;
  seoDescription?: string;
  bodyMarkdown: string;
  sourceType: ContentSourceType;
  sourceUrl: string;
  coverAssetId?: string;
  coverImageUrl?: string;
  coverAltText?: string;
  status: ContentStatus;
  visibility: ContentVisibility;
  allowComments: boolean;
  pinned: boolean;
  featured: boolean;
  viewCount: number;
  likeCount: number;
  categories: string[];
  tags: string[];
  series: string[];
  project?: ProjectMetadata;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

type NullableContentMetadataKey = 'seoTitle' | 'seoDescription' | 'coverAssetId';

export type ContentRecordPatch = Partial<Omit<ContentRecord, NullableContentMetadataKey>> & {
  seoTitle?: string | null;
  seoDescription?: string | null;
  coverAssetId?: string | null;
};

export type CreateContentRecordInput = Omit<ContentRecord, 'createdAt' | 'id' | 'updatedAt'>;

export interface CreateDraftInput {
  type: ContentType;
  title: string;
  slug: string;
  summary: string;
  seoTitle?: string;
  seoDescription?: string;
  bodyMarkdown: string;
  sourceType?: ContentSourceType;
  sourceUrl?: string;
  coverAssetId?: string;
  categories?: string[];
  tags?: string[];
  series?: string[];
  project?: ProjectMetadata;
}

export type UpdateContentInput = Partial<{
  type: ContentType;
  title: string;
  slug: string;
  summary: string;
  seoTitle: string;
  seoDescription: string;
  bodyMarkdown: string;
  sourceType: ContentSourceType;
  sourceUrl: string;
  coverAssetId: string;
  allowComments: boolean;
  pinned: boolean;
  featured: boolean;
  categories: string[];
  tags: string[];
  series: string[];
  project: ProjectMetadata;
}>;

export interface AdminContentFilter {
  type?: ContentType;
  status?: ContentStatus;
  query?: string;
  category?: string;
  tag?: string;
  series?: string;
}

export interface PublicContentFilter {
  type?: ContentType;
  sort?: PublicContentSort;
  query?: string;
}

export type PublicContentSort = 'latest' | 'popular';
