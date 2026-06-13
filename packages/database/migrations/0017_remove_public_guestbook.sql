update site_settings
set
  value = (
    select coalesce(jsonb_agg(to_jsonb(item) order by ordinality), '[]'::jsonb)
    from jsonb_array_elements_text(value) with ordinality as navigation(item, ordinality)
    where item <> 'guestbook'
  ),
  updated_at = now()
where key = 'navigation'
  and value ? 'guestbook';

update site_settings
set
  value = jsonb_set(
    value,
    '{description}',
    to_jsonb('我是 Aster.H，这里是我的个人内容平台。文章、笔记、日常和项目都会长期沉淀在这里，方便公开分享，也方便我回看自己的思考和成长轨迹。'::text)
  ),
  updated_at = now()
where key = 'profile'
  and value->>'description' = '我是 Aster.H，这里是我的个人内容平台。文章、笔记、日常、项目和留言都会长期沉淀在这里，方便公开分享，也方便我回看自己的思考和成长轨迹。';
