create table if not exists leetcode_study_settings (
  id boolean primary key default true check (id),
  leetcode_username text not null default '',
  active_list_id text not null default 'hot100' check (active_list_id in ('hot100', 'offer75', 'top150')),
  round_count integer not null default 5 check (round_count between 2 and 10),
  review_intervals integer[] not null default array[1, 3, 7, 14],
  daily_new integer not null default 3 check (daily_new >= 0),
  daily_review integer not null default 5 check (daily_review >= 0),
  deadline date,
  updated_at timestamptz not null default now()
);

insert into leetcode_study_settings (id)
values (true)
on conflict (id) do nothing;

create table if not exists leetcode_problems (
  slug text primary key,
  problem_number integer not null check (problem_number >= 0),
  title text not null,
  difficulty text not null check (difficulty in ('简单', '中等', '困难')),
  category text not null,
  list_ids text[] not null default array['hot100'],
  rounds jsonb not null default '[]'::jsonb,
  notes text not null default '',
  solution_viewed boolean not null default false,
  must_repeat boolean not null default false,
  time_spent_seconds jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leetcode_problems_list_ids_idx
  on leetcode_problems using gin (list_ids);

create table if not exists leetcode_submissions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_slug text not null,
  status text not null,
  language text not null,
  submitted_at timestamptz not null,
  problem_url text not null,
  created_at timestamptz not null default now(),
  unique (title_slug, submitted_at)
);

create index if not exists leetcode_submissions_submitted_at_idx
  on leetcode_submissions (submitted_at desc);
