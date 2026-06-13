update site_settings
set
  value = (
    select coalesce(jsonb_agg(to_jsonb(item) order by ordinality), '[]'::jsonb)
    from jsonb_array_elements_text(value) with ordinality as navigation(item, ordinality)
    where item <> 'series'
  ),
  updated_at = now()
where key = 'navigation'
  and value ? 'series';
