import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
  type TaxonomyTerm,
  type TaxonomyType,
} from './taxonomy.repository.js';

export interface CreateTaxonomyInput {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface UpdateTaxonomyInput {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  sortOrder?: number;
}

@Injectable()
export class TaxonomyService {
  constructor(
    @Inject(TAXONOMY_REPOSITORY)
    private readonly repository: TaxonomyRepository,
  ) {}

  async listTerms(type: TaxonomyType): Promise<TaxonomyTerm[]> {
    this.assertTaxonomyType(type);
    return this.repository.list(type);
  }

  async createTerm(type: TaxonomyType, input: CreateTaxonomyInput): Promise<TaxonomyTerm> {
    this.assertTaxonomyType(type);
    await this.assertParentAllowed(type, input.parentId);
    const slug = this.normalizeSlug(input.slug ?? input.name);
    await this.ensureSlugAvailable(type, slug);

    return this.repository.create({
      type,
      name: input.name.trim(),
      slug,
      description: input.description?.trim() ?? '',
      parentId: normalizeParentId(input.parentId),
      sortOrder: input.sortOrder ?? 0,
    });
  }

  async updateTerm(type: TaxonomyType, id: string, input: UpdateTaxonomyInput): Promise<TaxonomyTerm> {
    this.assertTaxonomyType(type);
    const record = await this.getTerm(type, id);
    await this.assertParentAllowed(type, input.parentId, id);
    const slug = input.slug ?? input.name ? this.normalizeSlug(input.slug ?? input.name ?? record.slug) : undefined;

    if (slug && slug !== record.slug) {
      await this.ensureSlugAvailable(type, slug);
    }

    const patch: UpdateTaxonomyInput = {};

    if (input.name !== undefined) {
      patch.name = input.name.trim();
    }

    if (slug !== undefined) {
      patch.slug = slug;
    }

    if (input.description !== undefined) {
      patch.description = input.description.trim();
    }

    if (input.parentId !== undefined) {
      patch.parentId = input.parentId === null ? null : normalizeParentId(input.parentId);
    }

    if (input.sortOrder !== undefined) {
      patch.sortOrder = input.sortOrder;
    }

    const updated = await this.repository.update(type, id, patch);

    return this.ensureRecord(updated, type, id);
  }

  async deleteTerm(type: TaxonomyType, id: string): Promise<void> {
    this.assertTaxonomyType(type);
    const deleted = await this.repository.delete(type, id);

    if (!deleted) {
      throw new NotFoundException(`${type} ${id} was not found`);
    }
  }

  private async getTerm(type: TaxonomyType, id: string): Promise<TaxonomyTerm> {
    return this.ensureRecord(await this.repository.findById(type, id), type, id);
  }

  private ensureRecord(record: TaxonomyTerm | null, type: TaxonomyType, id: string): TaxonomyTerm {
    if (record) {
      return record;
    }

    throw new NotFoundException(`${type} ${id} was not found`);
  }

  private async ensureSlugAvailable(type: TaxonomyType, slug: string): Promise<void> {
    const existing = await this.repository.findBySlug(type, slug);

    if (existing) {
      throw new ConflictException(`${type} slug "${slug}" already exists`);
    }
  }

  private async assertParentAllowed(type: TaxonomyType, parentId: string | null | undefined, currentId?: string): Promise<void> {
    const normalizedParentId = normalizeParentId(parentId);

    if (!normalizedParentId) {
      return;
    }

    if (type !== 'category') {
      throw new BadRequestException('Only categories can have parent terms');
    }

    if (currentId && normalizedParentId === currentId) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    const parent = await this.repository.findById('category', normalizedParentId);

    if (!parent) {
      throw new NotFoundException(`Parent category ${normalizedParentId} was not found`);
    }

    if (currentId && parent.parentId === currentId) {
      throw new BadRequestException('A category cannot use one of its children as parent');
    }
  }

  private normalizeSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private assertTaxonomyType(type: TaxonomyType): void {
    if (type !== 'category' && type !== 'tag' && type !== 'series') {
      throw new BadRequestException(`Unsupported taxonomy type: ${type}`);
    }
  }
}

function normalizeParentId(value: string | null | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized || undefined;
}
