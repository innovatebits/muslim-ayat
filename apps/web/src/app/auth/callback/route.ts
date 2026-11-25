import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { exchangeOAuthCode } from "@/lib/auth-oauth";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (requestUrl.searchParams.has("error")) {
    return NextResponse.redirect(new URL("/sign-in?error=oauth", requestUrl.origin));
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/sign-in?error=setup", requestUrl.origin));
  }

  const exchanged = await exchangeOAuthCode(code, async (authCode) => {
    const client = await createClient();
    return client.auth.exchangeCodeForSession(authCode);
  });
  if (exchanged) return NextResponse.redirect(new URL("/account", requestUrl.origin));

  return NextResponse.redirect(new URL("/sign-in?error=oauth", requestUrl.origin));
}