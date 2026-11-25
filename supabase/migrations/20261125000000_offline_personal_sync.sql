alter table public.bookmarks
  add column client_updated_at timestamptz not null default now(),
  add column sync_operation_id uuid not null default gen_random_uuid(),
  add column is_deleted boolean not null default false;

alter table public.user_notes
  add column client_id uuid not null default gen_random_uuid(),
  add column client_updated_at timestamptz not null default now(),
  add column sync_operation_id uuid not null default gen_random_uuid(),
  add column is_deleted boolean not null default false;

create unique index user_notes_user_client_id_key
  on public.user_notes (user_id, client_id);

alter table public.reading_progress
  add column client_updated_at timestamptz not null default now(),
  add column sync_operation_id uuid not null default gen_random_uuid();