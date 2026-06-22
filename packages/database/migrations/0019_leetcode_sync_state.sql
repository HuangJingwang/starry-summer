alter table leetcode_study_settings
  add column if not exists last_synced_at timestamptz,
  add column if not exists history_backfilled_at timestamptz,
  add column if not exists history_backfilled_username text not null default '',
  add column if not exists history_backfilled_list_id text not null default '';
