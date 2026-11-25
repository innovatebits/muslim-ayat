import type { Metadata } from "next";
import Link from "next/link";
import { deleteBookmarkAction, deleteNoteAction } from "@/app/actions/personal-data";
import { getSurahIndex } from "@muslim-ayat/quran-data/reader";
import { getPersonalData } from "@/lib/personal-data";
import { featureFlags } from "@/lib/features";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bookmarks and notes",
  description: "Review your private Quran bookmarks and notes.",
};

export default async function BookmarksPage() {
  if (!featureFlags.bookmarks && !featureFlags.notes) notFound();
  const personalData = await getPersonalData();
  const surahs = getSurahIndex();

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 pb-16 pt-6 sm:px-8">
      <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
        <Link className="text-sm font-medium text-[var(--green)] hover:underline" href="/quran">
          ← Quran reader
        </Link>
        <Link className="text-sm text-[var(--muted)] hover:text-[var(--green)]" href="/account">
          Account
        </Link>
      </header>

      <section className="mt-10">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--green)]">Bookmarks and notes</h1>
        {!personalData.configured ? (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950" role="status">
            Configure the public Supabase URL and publishable key to use personal bookmarks and notes.
          </p>
        ) : !personalData.user ? (
          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white/80 p-5">
            <p className="text-sm text-[var(--muted)]">Your bookmarks and notes are private to your account.</p>
            <Link className="mt-4 inline-block text-sm font-semibold text-[var(--green)] hover:underline" href="/sign-in">
              Sign in to continue
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            {featureFlags.bookmarks ? (
            <section>
              <h2 className="text-xl font-semibold text-[var(--green)]">Bookmarks</h2>
              {personalData.bookmarks.length ? (
                <ul className="mt-4 space-y-3">
                  {personalData.bookmarks.map((bookmark) => {
                    const surah = surahs[bookmark.surah_number - 1];
                    return (
                      <li key={bookmark.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-white/80 p-4">
                        <Link className="text-sm font-medium text-[var(--green)] hover:underline" href={`/surah/${bookmark.surah_number}#ayah-${bookmark.ayah_number}`}>
                          {surah?.nameTransliteration ?? `Surah ${bookmark.surah_number}`} · Ayah {bookmark.ayah_number}
                        </Link>
                        <form action={deleteBookmarkAction}>
                          <input name="id" type="hidden" value={bookmark.id} />
                          <button className="text-xs font-medium text-[var(--muted)] hover:text-rose-700" type="submit">
                            Remove
                          </button>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-[var(--muted)]">No bookmarks yet. Save an ayah from the reader.</p>
              )}
            </section>
            ) : null}

            {featureFlags.notes ? (
            <section>
              <h2 className="text-xl font-semibold text-[var(--green)]">Notes</h2>
              {personalData.notes.length ? (
                <ul className="mt-4 space-y-3">
                  {personalData.notes.map((note) => {
                    const surah = surahs[note.surah_number - 1];
                    return (
                      <li key={note.id} className="rounded-xl border border-[var(--line)] bg-white/80 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <Link className="text-sm font-medium text-[var(--green)] hover:underline" href={`/surah/${note.surah_number}#ayah-${note.ayah_number}`}>
                            {surah?.nameTransliteration ?? `Surah ${note.surah_number}`} · Ayah {note.ayah_number}
                          </Link>
                          <form action={deleteNoteAction}>
                            <input name="id" type="hidden" value={note.id} />
                            <button className="text-xs font-medium text-[var(--muted)] hover:text-rose-700" type="submit">
                              Remove
                            </button>
                          </form>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--ink)]">{note.content}</p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-[var(--muted)]">No notes yet. Add a private note from an ayah.</p>
              )}
            </section>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}