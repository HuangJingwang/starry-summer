create extension if not exists pgcrypto;

create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('post', 'note', 'moment', 'page', 'project')),
  title text not null,
  slug text not null unique,
  summary text not null default '',
  body_markdown text not null default '',
  body_html text not null default '',
  source_type text not null default 'original' check (source_type in ('original', 'repost')),
  source_url text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'private', 'archived')),
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  cover_asset_id uuid,
  seo_title text,
  seo_description text,
  allow_comments boolean not null default true,
  pinned boolean not null default false,
  featured boolean not null default false,
  view_count integer not null default 0 check (view_count >= 0),
  like_count integer not null default 0 check (like_count >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_items_public_idx
  on content_items (type, published_at desc)
  where status = 'published' and visibility = 'public';

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists series (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  cover_asset_id uuid,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists content_categories (
  content_id uuid not null references content_items(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (content_id, category_id)
);

create table if not exists content_tags (
  content_id uuid not null references content_items(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (content_id, tag_id)
);

create table if not exists content_series (
  content_id uuid not null references content_items(id) on delete cascade,
  series_id uuid not null references series(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (content_id, series_id)
);

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  storage_key text not null unique,
  public_url text not null,
  mime_type text not null,
  byte_size integer not null check (byte_size >= 0),
  alt_text text not null default '',
  created_at timestamptz not null default now()
);

alter table content_items
  add constraint content_items_cover_asset_fk
  foreign key (cover_asset_id) references assets(id) on delete set null;

alter table series
  add constraint series_cover_asset_fk
  foreign key (cover_asset_id) references assets(id) on delete set null;

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post', 'note', 'project')),
  target_id uuid not null references content_items(id) on delete cascade,
  author_name text not null,
  author_email_hash text,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'spam')),
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now(),
  moderated_at timestamptz
);

create index if not exists comments_target_visible_idx
  on comments (target_type, target_id, created_at desc)
  where status = 'approved';

create table if not exists guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_email_hash text,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'spam')),
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now(),
  moderated_at timestamptz
);

create index if not exists guestbook_entries_visible_idx
  on guestbook_entries (created_at desc)
  where status = 'approved';

create table if not exists content_likes (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post', 'note', 'moment', 'page', 'project')),
  target_id uuid not null references content_items(id) on delete cascade,
  actor_hash text not null,
  created_at timestamptz not null default now(),
  unique (target_type, target_id, actor_hash)
);

create table if not exists view_events (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post', 'note', 'moment', 'page', 'project')),
  target_id uuid not null references content_items(id) on delete cascade,
  actor_hash text,
  created_at timestamptz not null default now()
);

create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into site_settings (key, value)
values
  ('profile', '{"title":"Starry Summer","ownerName":"Owner","description":"A personal content platform."}'::jsonb),
  ('navigation', '["posts","notes","moments","projects","guestbook","about"]'::jsonb)
on conflict (key) do nothing;
