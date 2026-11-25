"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@muslim-ayat/database";
import { getPublicSupabaseEnv } from "./env";

export function createClient() {
  const { url, publishableKey } = getPublicSupabaseEnv();
  return createBrowserClient<Database>(url, publishableKey);
}