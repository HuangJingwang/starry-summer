update site_settings
set value = (
  select jsonb_agg(to_jsonb(item) order by sort_order)
  from (
    select item, ordinality::numeric as sort_order
    from jsonb_array_elements_text(site_settings.value) with ordinality as navigation(item, ordinality)
    union all
    select
      'search',
      coalesce(
        (
          select ordinality::numeric - 0.5
          from jsonb_array_elements_text(site_settings.value) with ordinality as navigation(item, ordinality)
          where item = 'about'
          limit 1
        ),
        jsonb_array_length(site_settings.value)::numeric + 1
      )
  ) as next_navigation(item, sort_order)
)
where key = 'navigation'
  and jsonb_typeof(value) = 'array'
  and not exists (
    select 1
    from jsonb_array_elements_text(value) as navigation(item)
    where item = 'search'
  );
