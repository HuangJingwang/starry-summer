update site_settings
set
  value = jsonb_set(
    jsonb_set(value, '{ownerName}', to_jsonb('Aster.H'::text)),
    '{description}',
    to_jsonb('我是 Aster.H，这里是我的个人内容平台。文章、笔记、日常和项目都会长期沉淀在这里，方便公开分享，也方便我回看自己的思考和成长轨迹。'::text)
  ),
  updated_at = now()
where key = 'profile'
  and (
    value->>'ownerName' is distinct from 'Aster.H'
    or value->>'description' not like '%Aster.H%'
  );
