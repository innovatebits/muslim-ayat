create function public.sync_bookmark(
  p_owner_id uuid,
  p_surah_number smallint,
  p_ayah_number smallint,
  p_client_updated_at timestamptz,
  p_sync_operation_id uuid,
  p_is_deleted boolean
)
returns public.bookmarks
language plpgsql
set search_path = ''
as $$
declare
  result public.bookmarks;
begin
  if auth.uid() is null or auth.uid() <> p_owner_id then
    raise exception 'Sync owner does not match the authenticated user' using errcode = '42501';
  end if;

  insert into public.bookmarks as current_record (
    user_id, surah_number, ayah_number, client_updated_at, sync_operation_id, is_deleted
  ) values (
    p_owner_id, p_surah_number, p_ayah_number, p_client_updated_at, p_sync_operation_id, p_is_deleted
  )
  on conflict (user_id, surah_number, ayah_number) do update set
    client_updated_at = excluded.client_updated_at,
    sync_operation_id = excluded.sync_operation_id,
    is_deleted = excluded.is_deleted
  where (current_record.client_updated_at, current_record.sync_operation_id)
    < (excluded.client_updated_at, excluded.sync_operation_id)
  returning * into result;

  if not found then
    select * into result
    from public.bookmarks
    where user_id = p_owner_id
      and surah_number = p_surah_number
      and ayah_number = p_ayah_number;
  end if;

  return result;
end;
$$;

create function public.sync_note(
  p_owner_id uuid,
  p_client_id uuid,
  p_surah_number smallint,
  p_ayah_number smallint,
  p_content text,
  p_client_updated_at timestamptz,
  p_sync_operation_id uuid,
  p_is_deleted boolean
)
returns public.user_notes
language plpgsql
set search_path = ''
as $$
declare
  result public.user_notes;
begin
  if auth.uid() is null or auth.uid() <> p_owner_id then
    raise exception 'Sync owner does not match the authenticated user' using errcode = '42501';
  end if;

  insert into public.user_notes as current_record (
    user_id, client_id, surah_number, ayah_number, content,
    client_updated_at, sync_operation_id, is_deleted
  ) values (
    p_owner_id, p_client_id, p_surah_number, p_ayah_number, p_content,
    p_client_updated_at, p_sync_operation_id, p_is_deleted
  )
  on conflict (user_id, client_id) do update set
    surah_number = excluded.surah_number,
    ayah_number = excluded.ayah_number,
    content = excluded.content,
    client_updated_at = excluded.client_updated_at,
    sync_operation_id = excluded.sync_operation_id,
    is_deleted = excluded.is_deleted
  where (current_record.client_updated_at, current_record.sync_operation_id)
    < (excluded.client_updated_at, excluded.sync_operation_id)
  returning * into result;

  if not found then
    select * into result
    from public.user_notes
    where user_id = p_owner_id and client_id = p_client_id;
  end if;

  return result;
end;
$$;

create function public.sync_reading_progress(
  p_owner_id uuid,
  p_surah_number smallint,
  p_ayah_number smallint,
  p_client_updated_at timestamptz,
  p_sync_operation_id uuid
)
returns public.reading_progress
language plpgsql
set search_path = ''
as $$
declare
  result public.reading_progress;
begin
  if auth.uid() is null or auth.uid() <> p_owner_id then
    raise exception 'Sync owner does not match the authenticated user' using errcode = '42501';
  end if;

  insert into public.reading_progress as current_record (
    user_id, surah_number, ayah_number, client_updated_at, sync_operation_id
  ) values (
    p_owner_id, p_surah_number, p_ayah_number, p_client_updated_at, p_sync_operation_id
  )
  on conflict (user_id) do update set
    surah_number = excluded.surah_number,
    ayah_number = excluded.ayah_number,
    client_updated_at = excluded.client_updated_at,
    sync_operation_id = excluded.sync_operation_id
  where (current_record.client_updated_at, current_record.sync_operation_id)
    < (excluded.client_updated_at, excluded.sync_operation_id)
  returning * into result;

  if not found then
    select * into result
    from public.reading_progress
    where user_id = p_owner_id;
  end if;

  return result;
end;
$$;

revoke all on function public.sync_bookmark(uuid, smallint, smallint, timestamptz, uuid, boolean) from public, anon;
revoke all on function public.sync_note(uuid, uuid, smallint, smallint, text, timestamptz, uuid, boolean) from public, anon;
revoke all on function public.sync_reading_progress(uuid, smallint, smallint, timestamptz, uuid) from public, anon;

grant execute on function public.sync_bookmark(uuid, smallint, smallint, timestamptz, uuid, boolean) to authenticated;
grant execute on function public.sync_note(uuid, uuid, smallint, smallint, text, timestamptz, uuid, boolean) to authenticated;
grant execute on function public.sync_reading_progress(uuid, smallint, smallint, timestamptz, uuid) to authenticated;