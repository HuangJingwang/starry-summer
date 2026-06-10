alter table assets
  add column if not exists usage text not null default 'content';

do $$
begin
  alter table assets
    add constraint assets_usage_check
    check (usage in ('content', 'cover', 'background', 'attachment'));
exception
  when duplicate_object then null;
end $$;
