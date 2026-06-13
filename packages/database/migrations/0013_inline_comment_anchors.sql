alter table comments
  add column if not exists anchor_text text,
  add column if not exists anchor_prefix text,
  add column if not exists anchor_suffix text,
  add column if not exists anchor_start integer,
  add column if not exists anchor_end integer,
  add column if not exists anchor_hash text;

create index if not exists comments_anchor_visible_idx
  on comments (target_type, target_id, anchor_hash, created_at desc)
  where status = 'approved' and anchor_hash is not null;
