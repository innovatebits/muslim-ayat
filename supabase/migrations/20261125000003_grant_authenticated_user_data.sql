-- Table grants are required in addition to RLS policies. These grants allow
-- authenticated clients to perform CRUD operations; the policies in the
-- initial schema continue to restrict every operation to the owning user.
grant select, insert, update, delete
  on table public.profiles, public.bookmarks, public.reading_progress, public.user_notes
  to authenticated;
