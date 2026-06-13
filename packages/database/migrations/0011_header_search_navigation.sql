update site_settings
set
  value = (
    select jsonb_agg(to_jsonb(item) order by sort_order)
    from (
      select 'search' as item, 0 as sort_order
      where exists (
        select 1
        from jsonb_array_elements_text(site_settings.value) as navigation(item)
        where item = 'search'
      )
      union all
      select item, ordinality
      from jsonb_array_elements_text(site_settings.value) with ordinality as navigation(item, ordinality)
      where item not in ('search', 'about')
    ) as next_navigation(item, sort_order)
  ),
  updated_at = now()
where key = 'navigation'
  and (
    value ? 'about'
    or exists (
      select 1
      from jsonb_array_elements_text(value) with ordinality as navigation(item, ordinality)
      where item = 'search'
        and ordinality <> 1
    )
  );
