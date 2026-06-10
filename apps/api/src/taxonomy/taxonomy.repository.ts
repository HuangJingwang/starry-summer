export type TaxonomyType = 'category' | 'tag' | 'series';

export interface TaxonomyTerm {
  id: string;
  type: TaxonomyType;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxonomyTermInput {
  type: TaxonomyType;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
}

export type UpdateTaxonomyTermInput = Partial<Omit<CreateTaxonomyTermInput, 'type'>>;

export interface TaxonomyRepository {
  create(input: CreateTaxonomyTermInput): Promise<TaxonomyTerm>;
  findById(type: TaxonomyType, id: string): Promise<TaxonomyTerm | null>;
  findBySlug(type: TaxonomyType, slug: string): Promise<TaxonomyTerm | null>;
  list(type: TaxonomyType): Promise<TaxonomyTerm[]>;
  update(type: TaxonomyType, id: string, patch: UpdateTaxonomyTermInput): Promise<TaxonomyTerm | null>;
  delete(type: TaxonomyType, id: string): Promise<boolean>;
}

export const TAXONOMY_REPOSITORY = Symbol('TAXONOMY_REPOSITORY');

export class InMemoryTaxonomyRepository implements TaxonomyRepository {
  private readonly records = new Map<string, TaxonomyTerm>();
  private nextId = 1;

  constructor(private readonly now: () => string = () => new Date().toISOString()) {}

  async create(input: CreateTaxonomyTermInput): Promise<TaxonomyTerm> {
    const now = this.now();
    const record: TaxonomyTerm = {
      ...input,
      id: String(this.nextId++),
      createdAt: now,
      updatedAt: now,
    };

    this.records.set(record.id, record);
    return record;
  }

  async findById(type: TaxonomyType, id: string): Promise<TaxonomyTerm | null> {
    const record = this.records.get(id) ?? null;

    return record?.type === type ? record : null;
  }

  async findBySlug(type: TaxonomyType, slug: string): Promise<TaxonomyTerm | null> {
    return [...this.records.values()].find((record) => record.type === type && record.slug === slug) ?? null;
  }

  async list(type: TaxonomyType): Promise<TaxonomyTerm[]> {
    return [...this.records.values()]
      .filter((record) => record.type === type)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }

  async update(type: TaxonomyType, id: string, patch: UpdateTaxonomyTermInput): Promise<TaxonomyTerm | null> {
    const record = await this.findById(type, id);

    if (!record) {
      return null;
    }

    const updated = {
      ...record,
      ...patch,
      updatedAt: this.now(),
    };
    this.records.set(id, updated);

    return updated;
  }

  async delete(type: TaxonomyType, id: string): Promise<boolean> {
    const record = await this.findById(type, id);

    if (!record) {
      return false;
    }

    return this.records.delete(id);
  }
}
