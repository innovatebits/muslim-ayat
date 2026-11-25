import { z } from "zod";

const publicSupabaseEnvSchema = z.object({
  url: z.string().url(),
  publishableKey: z.string().min(1),
});

export function getPublicSupabaseEnv() {
  const result = publicSupabaseEnvSchema.safeParse(getPublicSupabaseEnvValue());

  if (!result.success) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to use Supabase.");
  }

  return result.data;
}

export function isSupabaseConfigured() {
  return publicSupabaseEnvSchema.safeParse(getPublicSupabaseEnvValue()).success;
}

function getPublicSupabaseEnvValue() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}