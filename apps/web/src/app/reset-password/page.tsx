import type { Metadata } from "next";
import Link from "next/link";
import { updatePasswordAction } from "@/app/actions/auth";
import { featureFlags } from "@/lib/features";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your Muslim Ayat account.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  if (!featureFlags.authPasswordReset || !featureFlags.authEmailPassword) {
    return <main className="mx-auto max-w-xl px-5 py-16"><p className="text-sm">Password reset is disabled for this deployment.</p><Link href="/sign-in">Return to sign in</Link></main>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl px-5 py-16">
      <Link className="text-sm font-medium text-[var(--green)] hover:underline" href="/sign-in">← Sign in</Link>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight text-[var(--green)]">Choose a new password</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Use at least 8 characters. This form is available after opening a valid password reset email.</p>
      {error ? <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert">{error === "reset" ? "The password could not be updated. Request a new reset link." : "The password must be at least 8 characters."}</p> : null}
      <form action={updatePasswordAction} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">New password<input autoComplete="new-password" className="mt-2 block w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5" minLength={8} name="password" required type="password" /></label>
        <button className="rounded-full bg-[var(--green)] px-5 py-2.5 text-sm font-medium text-white" type="submit">Update password</button>
      </form>
    </main>
  );
}
