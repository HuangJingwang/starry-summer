create unique index if not exists view_events_target_actor_idx
  on view_events (target_type, target_id, actor_hash)
  where actor_hash is not null;
