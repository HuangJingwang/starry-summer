alter table categories
  add column if not exists parent_id uuid references categories(id) on delete set null;

do $$
begin
  alter table categories
    add constraint categories_parent_not_self
    check (parent_id is null or parent_id <> id);
exception
  when duplicate_object then null;
end $$;

create index if not exists categories_parent_idx
  on categories (parent_id, sort_order, name);
