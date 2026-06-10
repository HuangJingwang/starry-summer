alter table content_items
  add column if not exists project_status text,
  add column if not exists project_links jsonb not null default '{}'::jsonb,
  add column if not exists project_stack text[] not null default '{}',
  add column if not exists project_started_at date,
  add column if not exists project_ended_at date;

alter table content_items
  drop constraint if exists content_items_project_status_check;

alter table content_items
  add constraint content_items_project_status_check
  check (project_status is null or project_status in ('active', 'paused', 'completed', 'archived'));
