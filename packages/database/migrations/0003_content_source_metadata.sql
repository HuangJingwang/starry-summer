alter table content_items
  add column if not exists source_type text not null default 'original',
  add column if not exists source_url text not null default '';

do $$
begin
  alter table content_items
    add constraint content_items_source_type_check
    check (source_type in ('original', 'repost'));
exception
  when duplicate_object then null;
end $$;
