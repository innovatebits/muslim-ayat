begin;

select plan(25);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at)
values
  ('00000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'owner@example.test', '', now()),
  ('00000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'other@example.test', '', now())
on conflict (id) do nothing;

insert into public.profiles (id, preferred_language)
values
  ('00000000-0000-4000-8000-000000000001', 'en'),
  ('00000000-0000-4000-8000-000000000002', 'ar');

insert into public.bookmarks (user_id, surah_number, ayah_number)
values
  ('00000000-0000-4000-8000-000000000001', 1, 1),
  ('00000000-0000-4000-8000-000000000002', 2, 1);

insert into public.reading_progress (user_id, surah_number, ayah_number)
values
  ('00000000-0000-4000-8000-000000000001', 1, 2),
  ('00000000-0000-4000-8000-000000000002', 2, 2);

insert into public.user_notes (user_id, client_id, surah_number, ayah_number, content)
values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', 1, 1, 'Owner note'),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000004', 2, 1, 'Other note');

create function pg_temp.affected_rows(statement text)
returns integer
language plpgsql
as $
declare
  affected integer;
begin
  execute statement;
  get diagnostics affected = row_count;
  return affected;
end;
$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

select is((select count(*)::integer from public.profiles), 1, 'a signed-in user sees only their profile');
select is((select count(*)::integer from public.profiles where id = '00000000-0000-4000-8000-000000000002'), 0, 'a user cannot read another profile');
select is(pg_temp.affected_rows($update public.profiles set preferred_language = 'fr' where id = '00000000-0000-4000-8000-000000000001'$), 1, 'a user can update their own profile');
select is(pg_temp.affected_rows($update public.profiles set reader_preferences = '{"readingMode":"mushaf","translationId":"none","showTransliteration":false,"arabicFontSize":"large"}'::jsonb where id = '00000000-0000-4000-8000-000000000001'$), 1, 'a user can update their own reader preferences');
select is((select reader_preferences->>'readingMode' from public.profiles where id = '00000000-0000-4000-8000-000000000001'), 'mushaf', 'reader preferences persist on the owner profile');
select is(pg_temp.affected_rows($update public.profiles set reader_preferences = '{"readingMode":"mushaf","translationId":"none","showTransliteration":false,"arabicFontSize":"large"}'::jsonb where id = '00000000-0000-4000-8000-000000000002'$), 0, 'a user cannot update another profile preferences');
select is((select count(*)::integer from public.bookmarks), 1, 'a user sees only their bookmarks');
select is(pg_temp.affected_rows($insert into public.bookmarks (user_id, surah_number, ayah_number) values ('00000000-0000-4000-8000-000000000001', 1, 2)$), 1, 'a user can create their own bookmark');
select throws_ok(
  $$insert into public.bookmarks (user_id, surah_number, ayah_number) values ('00000000-0000-4000-8000-000000000002', 3, 1)$$,
  '42501',
  'new row violates row-level security policy for table "bookmarks"',
  'a user cannot create a bookmark for another user'
);
select is(pg_temp.affected_rows($update public.bookmarks set ayah_number = 2 where user_id = '00000000-0000-4000-8000-000000000002'$), 0, 'a user cannot update another bookmark');
select is(pg_temp.affected_rows($delete from public.user_notes where user_id = '00000000-0000-4000-8000-000000000002'$), 0, 'a user cannot delete another note');
select is(pg_temp.affected_rows($insert into public.user_notes (user_id, surah_number, ayah_number, content) values ('00000000-0000-4000-8000-000000000001', 1, 2, 'Private note')$), 1, 'a user can create their own note');
select is(pg_temp.affected_rows($insert into public.reading_progress (user_id, surah_number, ayah_number) values ('00000000-0000-4000-8000-000000000001', 1, 3) on conflict (user_id) do update set surah_number = excluded.surah_number, ayah_number = excluded.ayah_number$), 1, 'a user can update their own reading progress');
select is((select count(*)::integer from public.reading_progress), 1, 'a user sees only their reading progress');
select is(pg_temp.affected_rows($delete from public.user_notes where user_id = '00000000-0000-4000-8000-000000000001' and content = 'Private note'$), 1, 'a user can delete their own note');
select throws_ok(
  $$select public.sync_bookmark('00000000-0000-4000-8000-000000000002', 4, 1, '2099-01-01T00:00:00Z', '00000000-0000-4000-8000-0000000000a1', false)$$,
  '42501',
  'Sync owner does not match the authenticated user',
  'sync RPC rejects another owner ID'
);
select is((public.sync_bookmark('00000000-0000-4000-8000-000000000001', 1, 1, '2099-01-01T00:00:00Z', '00000000-0000-4000-8000-0000000000a2', true)).is_deleted, true, 'the newer bookmark tombstone wins');
select is((public.sync_bookmark('00000000-0000-4000-8000-000000000001', 1, 1, '2098-01-01T00:00:00Z', '00000000-0000-4000-8000-0000000000a3', false)).is_deleted, true, 'an older bookmark replay cannot undo a deletion');
select is((public.sync_note('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', 1, 1, 'Newer owner note', '2099-01-01T00:00:00Z', '00000000-0000-4000-8000-0000000000a4', false)).is_deleted, false, 'the newer note revision is accepted');
select is((public.sync_note('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', 1, 1, 'Deleted note', '2098-01-01T00:00:00Z', '00000000-0000-4000-8000-0000000000a5', true)).content, 'Newer owner note', 'an older note deletion cannot replace newer content');
select is((public.sync_reading_progress('00000000-0000-4000-8000-000000000001', 1, 3, '2099-01-01T00:00:00Z', '00000000-0000-4000-8000-0000000000a6')).ayah_number, 3, 'the newer reading position is accepted');
select is((public.sync_reading_progress('00000000-0000-4000-8000-000000000001', 2, 1, '2098-01-01T00:00:00Z', '00000000-0000-4000-8000-0000000000a7')).surah_number, 1, 'an older reading position cannot replace the newer one');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from public.user_notes), 1, 'the second user sees their own note');

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select is((select count(*)::integer from public.profiles), 0, 'a signed-out visitor cannot see profiles');
select is((select count(*)::integer from public.bookmarks), 0, 'a signed-out visitor cannot see bookmarks');

select * from finish();
rollback;