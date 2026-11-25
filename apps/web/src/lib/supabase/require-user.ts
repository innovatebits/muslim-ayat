import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const client = await createClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) throw new Error("AUTH_REQUIRED");

  return { client, user };
}