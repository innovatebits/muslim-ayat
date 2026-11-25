import type { Metadata } from "next";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { updateProfileAction } from "@/app/actions/personal-data";
import { getSurahIndex } from "@muslim-ayat/quran-data/reader";
import { getPersonalData } from "@/lib/personal-data";
import { getAccountIdentityLabel } from "@/lib/account-identity";
import { featureFlags } from "@/lib/features";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your profile, bookmarks, notes, and Quran reading progress.",
};

export default async function AccountPage() {
  const personalData = await getPersonalData();
  const surahs = getSurahIndex();
  const progressSurah = personalData.progress
    ? surahs[personalData.progress.surah_number - 1]
    : undefined;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 pb-16 pt-6 sm:px-8">
      <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
        <Link className="text-sm font-medium text-[var(--green)] hover:underline" href="/quran">
          ← Quran reader
        </Link>
        <nav aria-label="Account navigation" className="flex gap-4 text-sm">
          <Link className="text-[var(--muted)] hover:text-[var(--green)]" href="/bookmarks">
            Bookmarks
          </Link>
          <Link className="text-[var(--muted)] hover:text-[var(--green)]" href="/sign-in">
            Sign in
          </Link>
        </nav>
      </header>

      <section className="mt-10">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--green)]">Your account</h1>
        {!personalData.configured ? (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950" role="status">
            Account features are not configured. Add the public Supabase URL and publishable key to
            the web app environment to enable sign-in and synchronization.
          </p>
        ) : !personalData.user ? (
          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white/80 p-5">
            <p className="text-sm leading-6 text-[var(--muted)]">
              Sign in to manage your private profile and reading data. The Quran reader remains
              available without an account.
            </p>
            <Link className="mt-4 inline-block rounded-full bg-[var(--green)] px-5 py-2.5 text-sm font-medium text-white" href="/sign-in">
              Sign in with a provider
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-white/80 p-5">
              <p className="text-sm text-[var(--muted)]">
                Signed in as{" "}
                <span className="font-medium text-[var(--ink)]">
                  {getAccountIdentityLabel(personalData.user.email)}
                </span>
              </p>
              <form action={signOutAction}>
                <button className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--green)]" type="submit">
                  Sign out
                </button>
              </form>
            </div>

            {featureFlags.accountProfile ? (
            <form action={updateProfileAction} className="rounded-2xl border border-[var(--line)] bg-white/80 p-5 sm:p-7">
              <h2 className="text-lg font-semibold text-[var(--green)]">Profile preferences</h2>
              <label className="mt-4 block max-w-sm text-sm font-medium text-[var(--ink)]" htmlFor="preferred-language">
                Preferred language
                <input
                  autoComplete="language"
                  className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5"
                  defaultValue={personalData.profile?.preferred_language ?? "en"}
                  id="preferred-language"
                  maxLength={35}
                  name="preferredLanguage"
                  pattern="[A-Za-z]{2}(-[A-Za-z0-9]{2,8})*"
                  required
                />
              </label>
              <button className="mt-4 rounded-full bg-[var(--green)] px-5 py-2.5 text-sm font-medium text-white" type="submit">
                Save profile
              </button>
            </form>
            ) : null}

            <section className="grid gap-6 md:grid-cols-2">
              {featureFlags.readingProgress ? (
              <article className="rounded-2xl border border-[var(--line)] bg-white/80 p-5">
                <h2 className="text-lg font-semibold text-[var(--green)]">Reading progress</h2>
                {personalData.progress && progressSurah ? (
                  <Link
                    className="mt-3 inline-block text-sm font-medium text-[var(--green)] hover:underline"
                    href={`/surah/${personalData.progress.surah_number}#ayah-${personalData.progress.ayah_number}`}
                  >
                    Continue {progressSurah.nameTransliteration}, ayah {personalData.progress.ayah_number}
                  </Link>
                ) : (
                  <p className="mt-3 text-sm text-[var(--muted)]">No reading position saved yet.</p>
                )}
              </article>
              ) : null}
              {featureFlags.bookmarks || featureFlags.notes ? (
              <article className="rounded-2xl border border-[var(--line)] bg-white/80 p-5">
                <h2 className="text-lg font-semibold text-[var(--green)]">Personal items</h2>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  {personalData.bookmarks.length} bookmarks · {personalData.notes.length} recent notes
                </p>
                <Link className="mt-3 inline-block text-sm font-medium text-[var(--green)] hover:underline" href="/bookmarks">
                  Manage bookmarks and notes
                </Link>
              </article>
              ) : null}
            </section>

            {featureFlags.notes && personalData.notes.length ? (
              <section className="rounded-2xl border border-[var(--line)] bg-white/80 p-5">
                <h2 className="text-lg font-semibold text-[var(--green)]">Recent notes</h2>
                <ul className="mt-4 space-y-3">
                  {personalData.notes.slice(0, 5).map((note) => (
                    <li key={note.id}>
                      <Link className="text-sm font-medium text-[var(--green)] hover:underline" href={`/surah/${note.surah_number}#ayah-${note.ayah_number}`}>
                        Surah {note.surah_number}, ayah {note.ayah_number}
                      </Link>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--muted)]">{note.content}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}