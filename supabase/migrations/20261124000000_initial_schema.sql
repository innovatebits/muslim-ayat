create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  preferred_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  surah_number smallint not null check (surah_number between 1 and 114),
  ayah_number smallint not null check (ayah_number between 1 and 286),
  created_at timestamptz not null default now(),
  unique (user_id, surah_number, ayah_number)
);

create table public.reading_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  surah_number smallint not null check (surah_number between 1 and 114),
  ayah_number smallint not null check (ayah_number between 1 and 286),
  updated_at timestamptz not null default now()
);

create table public.user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  surah_number smallint not null check (surah_number between 1 and 114),
  ayah_number smallint not null check (ayah_number between 1 and 286),
  content text not null check (char_length(content) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger reading_progress_set_updated_at
  before update on public.reading_progress
  for each row execute function public.set_updated_at();
create trigger user_notes_set_updated_at
  before update on public.user_notes
  for each row execute function public.set_updated_at();

create index bookmarks_user_id_idx on public.bookmarks (user_id);
create index user_notes_user_id_idx on public.user_notes (user_id);

alter table public.profiles enable row level security;
alter table public.bookmarks enable row level security;
alter table public.reading_progress enable row level security;
alter table public.user_notes enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using ((select auth.uid()) = id);
create policy "Users can create their own profile"
  on public.profiles for insert
  with check ((select auth.uid()) = id);
create policy "Users can update their own profile"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users can manage their own bookmarks"
  on public.bookmarks for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage their own reading progress"
  on public.reading_progress for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage their own notes"
  on public.user_notes for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);