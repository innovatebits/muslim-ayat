import type { Metadata } from "next";
import Link from "next/link";
import {
  sendEmailOtpAction,
  sendMagicLinkAction,
  sendPasswordResetAction,
  signInWithPasswordAction,
  signInWithProviderAction,
  signUpWithPasswordAction,
  verifyEmailOtpAction,
} from "@/app/actions/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { featureFlags } from "@/lib/features";
import { getEnabledSocialAuthProviders } from "./providers";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to manage your Muslim Ayat profile and personal reading data.",
};

const errorMessages: Record<string, string> = {
  auth: "Your session could not be verified. Please sign in again.",
  oauth: "Social sign-in could not be completed. Check the provider configuration and try again.",
  setup: "Authentication is not configured. Add the Supabase URL and publishable key.",
  "method-disabled": "That sign-in method is disabled for this deployment.",
  "password-reset": "Your password could not be updated. Request another reset link and try again.",
  "invalid-input": "Check the email address and password or verification code.",
  credentials: "The email address or password is incorrect.",
  signup: "Your account could not be created. Check the details and try again.",
  email: "The email could not be sent. Check Supabase email/SMTP configuration and try again.",
  otp: "The verification code is invalid or expired. Request a new code and try again.",
};

const fieldClass = "mt-1 block w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm";
const buttonClass = "rounded-full bg-[var(--green)] px-5 py-2.5 text-sm font-medium text-white";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();
  const providers = getEnabledSocialAuthProviders();
  const errorMessage = params.error ? errorMessages[params.error] : undefined;
  const emailPasswordEnabled = featureFlags.authEmailPassword;
  const otpEnabled = featureFlags.authEmailOtp;
  const magicLinkEnabled = featureFlags.authMagicLink;
  const passwordResetEnabled = featureFlags.authPasswordReset;

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
          Sign in to keep bookmarks, notes, profile preferences and reading progress in your own account.
        </p>
      </section>

      {errorMessage ? <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert">{errorMessage}</p> : null}
      {params.notice === "signed-out" ? <p className="mt-6 rounded-xl border border-[var(--line)] bg-white p-4 text-sm" role="status">You have been signed out.</p> : null}
      {params.notice === "check-email" ? <p className="mt-6 rounded-xl border border-[var(--line)] bg-white p-4 text-sm" role="status">Check your email to confirm your account, then return here to sign in.</p> : null}
      {params.notice === "otp-sent" ? (
        <section className="mt-6 rounded-xl border border-[var(--line)] bg-white p-5">
          <p className="text-sm" role="status">A verification code has been sent. Enter it below.</p>
          <form action={verifyEmailOtpAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <label className="text-xs font-medium">Email<input autoComplete="email" className={fieldClass} name="email" required type="email" /></label>
            <label className="text-xs font-medium">Email code<input autoComplete="one-time-code" className={fieldClass} inputMode="numeric" maxLength={8} minLength={6} name="token" required /></label>
            <button className={buttonClass + " self-end"} type="submit">Verify code</button>
          </form>
        </section>
      ) : null}
      {params.notice === "magic-link-sent" ? <p className="mt-6 rounded-xl border border-[var(--line)] bg-white p-4 text-sm" role="status">Check your email for a sign-in link. Open it in this browser to finish signing in.</p> : null}
      {params.notice === "password-reset-sent" ? <p className="mt-6 rounded-xl border border-[var(--line)] bg-white p-4 text-sm" role="status">If an account exists for that address, a password reset email has been sent.</p> : null}

      {!configured ? (
        <p className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950" role="status">
          Account features are unavailable until <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> are configured.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          {providers.length ? (
            <section className="rounded-2xl border border-[var(--line)] bg-white/80 p-5 sm:p-7">
              <h2 className="text-lg font-semibold text-[var(--green)]">Continue with a provider</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {providers.map(({ id, name }) => (
                  <form action={signInWithProviderAction} key={id}>
                    <input name="provider" type="hidden" value={id} />
                    <button className="w-full rounded-full border border-[var(--green)] px-5 py-2.5 text-sm font-medium text-[var(--green)] hover:bg-[#edf0e7]" type="submit">Continue with {name}</button>
                  </form>
                ))}
              </div>
            </section>
          ) : null}

          {emailPasswordEnabled ? (
            <section className="rounded-2xl border border-[var(--line)] bg-white/80 p-5 sm:p-7">
              <h2 className="text-lg font-semibold text-[var(--green)]">Email and password</h2>
              <form action={signInWithPasswordAction} className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium">Email<input autoComplete="email" className={fieldClass} name="email" required type="email" /></label>
                <label className="text-xs font-medium">Password<input autoComplete="current-password" className={fieldClass} name="password" required type="password" /></label>
                <button className={buttonClass + " sm:col-span-2"} type="submit">Sign in</button>
              </form>
              {passwordResetEnabled ? (
                <form action={sendPasswordResetAction} className="mt-3 flex flex-wrap items-end gap-3">
                  <label className="min-w-0 flex-1 text-xs font-medium">Forgot password? Enter your email<input autoComplete="email" className={fieldClass} name="email" required type="email" /></label>
                  <button className="rounded-full border border-[var(--green)] px-4 py-2.5 text-sm font-medium text-[var(--green)]" type="submit">Send reset link</button>
                </form>
              ) : null}
              <div className="my-5 border-t border-[var(--line)]" />
              <h3 className="text-sm font-semibold text-[var(--green)]">Create an account</h3>
              <form action={signUpWithPasswordAction} className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium">Email<input autoComplete="email" className={fieldClass} name="email" required type="email" /></label>
                <label className="text-xs font-medium">Password (at least 8 characters)<input autoComplete="new-password" className={fieldClass} minLength={8} name="password" required type="password" /></label>
                <button className={buttonClass + " sm:col-span-2"} type="submit">Create account</button>
              </form>
            </section>
          ) : null}

          {otpEnabled ? (
            <section className="rounded-2xl border border-[var(--line)] bg-white/80 p-5 sm:p-7">
              <h2 className="text-lg font-semibold text-[var(--green)]">Email one-time code</h2>
              <form action={sendEmailOtpAction} className="mt-4 flex flex-wrap gap-3">
                <label className="min-w-0 flex-1 text-xs font-medium">Email<input autoComplete="email" className={fieldClass} name="email" required type="email" /></label>
                <button className={buttonClass + " self-end"} type="submit">Send code</button>
              </form>
            </section>
          ) : null}

          {magicLinkEnabled ? (
            <section className="rounded-2xl border border-[var(--line)] bg-white/80 p-5 sm:p-7">
              <h2 className="text-lg font-semibold text-[var(--green)]">Email magic link</h2>
              <form action={sendMagicLinkAction} className="mt-4 flex flex-wrap gap-3">
                <label className="min-w-0 flex-1 text-xs font-medium">Email<input autoComplete="email" className={fieldClass} name="email" required type="email" /></label>
                <button className={buttonClass + " self-end"} type="submit">Email me a sign-in link</button>
              </form>
            </section>
          ) : null}

          {!providers.length && !emailPasswordEnabled && !otpEnabled && !magicLinkEnabled ? (
            <p className="rounded-xl border border-[var(--line)] bg-white p-5 text-sm" role="status">All sign-in methods are disabled. Quran reading remains available without an account.</p>
          ) : null}
        </div>
      )}
      <p className="mt-5 text-xs leading-5 text-[var(--muted)]">You can read the Quran and browse public content without signing in.</p>
    </main>
  );
}
