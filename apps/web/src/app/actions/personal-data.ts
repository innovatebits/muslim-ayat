"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  PersonalRecordIdSchema,
  ProfilePreferencesSchema,
} from "@muslim-ayat/shared";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireUser } from "@/lib/supabase/require-user";

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

async function getAuthenticatedClient() {
  if (!isSupabaseConfigured()) redirect("/sign-in?error=setup");

  try {
    return await requireUser();
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      redirect("/sign-in?error=auth");
    }
    throw error;
  }
}

function revalidatePersonalViews(surahNumber?: number) {
  revalidatePath("/account");
  revalidatePath("/bookmarks");
  if (surahNumber) revalidatePath(`/surah/${surahNumber}`);
}

export async function updateProfileAction(formData: FormData) {
  const parsed = ProfilePreferencesSchema.safeParse({
    preferredLanguage: getString(formData, "preferredLanguage"),
  });
  if (!parsed.success) redirect("/account?error=profile");

  const { client, user } = await getAuthenticatedClient();
  const { error } = await client.from("profiles").upsert(
    { id: user.id, preferred_language: parsed.data.preferredLanguage },
    { onConflict: "id" },
  );
  if (error) redirect("/account?error=profile");

  revalidatePersonalViews();
}

export async function deleteBookmarkAction(formData: FormData) {
  const recordId = PersonalRecordIdSchema.safeParse({ id: getString(formData, "id") });
  if (!recordId.success) redirect("/bookmarks?error=invalid");

  const { client, user } = await getAuthenticatedClient();
  const { data: bookmark, error: lookupError } = await client
    .from("bookmarks")
    .select("surah_number, ayah_number")
    .eq("id", recordId.data.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (lookupError) redirect("/bookmarks?error=bookmark");

  if (bookmark) {
    const { error } = await client.rpc("sync_bookmark", {
      p_owner_id: user.id,
      p_surah_number: bookmark.surah_number,
      p_ayah_number: bookmark.ayah_number,
      p_client_updated_at: new Date().toISOString(),
      p_sync_operation_id: crypto.randomUUID(),
      p_is_deleted: true,
    });
    if (error) redirect("/bookmarks?error=bookmark");
  }

  revalidatePersonalViews(bookmark?.surah_number);
}

export async function deleteNoteAction(formData: FormData) {
  const recordId = PersonalRecordIdSchema.safeParse({ id: getString(formData, "id") });
  if (!recordId.success) redirect("/account?error=invalid");

  const { client, user } = await getAuthenticatedClient();
  const { data: note, error: lookupError } = await client
    .from("user_notes")
    .select("client_id, surah_number, ayah_number")
    .eq("id", recordId.data.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (lookupError) redirect("/bookmarks?error=note");

  if (note) {
    const { error } = await client.rpc("sync_note", {
      p_owner_id: user.id,
      p_client_id: note.client_id,
      p_surah_number: note.surah_number,
      p_ayah_number: note.ayah_number,
      p_content: "Deleted note",
      p_client_updated_at: new Date().toISOString(),
      p_sync_operation_id: crypto.randomUUID(),
      p_is_deleted: true,
    });
    if (error) redirect(`/surah/${note.surah_number}?error=note`);
  }

  revalidatePersonalViews(note?.surah_number);
}