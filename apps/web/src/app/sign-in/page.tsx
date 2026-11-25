import type { Metadata } from "next";
import Link from "next/link";
import { signInWithProviderAction } from "@/app/actions/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { socialAuthProviders } from "./providers";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to manage your Muslim Ayat profile and personal reading data.",
};

const errorMessages: Record<string, string> = {
  auth: "Your session could not be verified. Please sign in again.",
  oauth: "Sign-in could not be completed. The provider may have been cancelled, unavailable, or misconfigured. Please try again.",
  setup: "Authentication is not configured yet. Add the public Supabase URL and publishable key.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();
  const errorMessage = params.error ? errorMessages[params.error] : undefined;

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 pb-16 pt-6 sm:px-8">
      <header className="flex items-center justify-between border-b border-[var(--line)] pb-5">
        <Link className="text-sm font-medium text-[var(--green)] hover:underline" href="/quran">
          ← Quran reader
        </Link>
        <Link className="text-sm text-[var(--muted)] hover:text-[var(--green)]" href="/account">
          Account
        </Link>
      </header>

      <section className="mt-10">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--green)]">Your account</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Sign in to keep bookmarks, notes, profile preferences, and reading progress in your own
          Supabase account.
        </p>
      </section>

      {errorMessage ? (
        <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {params.notice === "signed-out" ? (
        <p className="mt-6 rounded-xl border border-[#dfe5da] bg-[#edf0e7] p-4 text-sm text-[var(--green)]" role="status">
          You have been signed out.
        </p>
      ) : null}

      {!configured ? (
        <p className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950" role="status">
          Account features are unavailable until <code>NEXT_PUBLIC_SUPABASE_URL</code> and
          <code> NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> are configured for the web app.
        </p>
      ) : (
        <section className="mt-8 rounded-2xl border border-[var(--line)] bg-white/80 p-5 sm:p-7">
          <h2 className="text-lg font-semibold text-[var(--green)]">Sign in with a provider</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Choose a provider to access your account on this or another device.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {socialAuthProviders.map(({ id, name }) => (
              <form action={signInWithProviderAction} key={id}>
                <input name="provider" type="hidden" value={id} />
                <button
                  className="w-full rounded-full border border-[var(--green)] px-5 py-2.5 text-sm font-medium text-[var(--green)] hover:bg-[#edf0e7]"
                  type="submit"
                >
                  Continue with {name}
                </button>
              </form>
            ))}
          </div>
          <p className="mt-5 text-xs leading-5 text-[var(--muted)]">
            You can read the Quran and browse public content without signing in.
          </p>
        </section>
      )}
    </main>
  );
}