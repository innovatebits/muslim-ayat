"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getOAuthCallbackUrl } from "@/lib/auth-oauth";
import { isSocialAuthProvider } from "../sign-in/providers";

export async function signInWithProviderAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/sign-in?error=setup");

  const provider = formData.get("provider");
  if (typeof provider !== "string" || !isSocialAuthProvider(provider)) {
    redirect("/sign-in?error=oauth");
  }

  const redirectTo = getOAuthCallbackUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (!redirectTo) redirect("/sign-in?error=setup");

  let authorizationUrl: string | null = null;
  try {
    const client = await createClient();
    const { data, error } = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (!error) authorizationUrl = data.url;
  } catch {
    redirect("/sign-in?error=oauth");
  }

  if (!authorizationUrl) redirect("/sign-in?error=oauth");
  redirect(authorizationUrl);
}

export async function signOutAction() {
  if (!isSupabaseConfigured()) redirect("/sign-in?error=setup");

  const client = await createClient();
  await client.auth.signOut();
  redirect("/sign-in?notice=signed-out");
}