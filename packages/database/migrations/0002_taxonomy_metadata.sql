alter table categories
  add column if not exists updated_at timestamptz not null default now();

alter table tags
  add column if not exists sort_order integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

alter table series
  add column if not exists updated_at timestamptz not null default now();
