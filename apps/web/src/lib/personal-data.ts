import type { Database } from "@muslim-ayat/database";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Bookmark = Database["public"]["Tables"]["bookmarks"]["Row"];
type ReadingProgress = Database["public"]["Tables"]["reading_progress"]["Row"];
type UserNote = Database["public"]["Tables"]["user_notes"]["Row"];

export type PersonalData = {
  configured: boolean;
  user: { id: string; email: string | null } | null;
  profile: Profile | null;
  bookmarks: Bookmark[];
  progress: ReadingProgress | null;
  notes: UserNote[];
};

const emptyPersonalData: PersonalData = {
  configured: false,
  user: null,
  profile: null,
  bookmarks: [],
  progress: null,
  notes: [],
};

export async function getPersonalData(surahNumber?: number): Promise<PersonalData> {
  if (!isSupabaseConfigured()) return emptyPersonalData;

  const client = await createClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) {
    return { ...emptyPersonalData, configured: true };
  }

  let bookmarksQuery = client
    .from("bookmarks")
    .select("*")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  let notesQuery = client
    .from("user_notes")
    .select("*")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  if (surahNumber) {
    bookmarksQuery = bookmarksQuery.eq("surah_number", surahNumber);
    notesQuery = notesQuery.eq("surah_number", surahNumber);
  }

  const [profileResult, bookmarksResult, progressResult, notesResult] = await Promise.all([
    client.from("profiles").select("*").maybeSingle(),
    bookmarksQuery.limit(100),
    client.from("reading_progress").select("*").maybeSingle(),
    notesQuery.limit(100),
  ]);

  if (profileResult.error || bookmarksResult.error || progressResult.error || notesResult.error) {
    throw new Error("Unable to load private account data.");
  }

  return {
    configured: true,
    user: { id: authData.user.id, email: authData.user.email ?? null },
    profile: profileResult.data,
    bookmarks: bookmarksResult.data,
    progress: progressResult.data,
    notes: notesResult.data,
  };
}