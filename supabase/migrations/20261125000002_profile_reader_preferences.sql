alter table public.profiles
  add column reader_preferences jsonb not null default '{
    "readingMode": "continuous",
    "translationId": "saheeh-international",
    "showTransliteration": true,
    "arabicFontSize": "comfortable"
  }'::jsonb,
  add constraint profiles_reader_preferences_valid check (
    jsonb_typeof(reader_preferences) = 'object'
    and jsonb_object_length(reader_preferences) = 4
    and reader_preferences->>'readingMode' in ('continuous', 'mushaf')
    and reader_preferences->>'translationId' in ('saheeh-international', 'none')
    and jsonb_typeof(reader_preferences->'showTransliteration') = 'boolean'
    and reader_preferences->>'arabicFontSize' in ('comfortable', 'large')
  );