import type { Metadata } from "next";
import Link from "next/link";
import { ContentSources } from "@/components/quran/ContentSources";
import { FutureReleaseNote } from "@/components/quran/FutureReleaseNote";
import { getSurahIndex } from "@muslim-ayat/quran-data/reader";
import { featureFlags } from "@/lib/features";

export const metadata: Metadata = {
  title: "Quran reader",
  description: "Browse the Quran with QUL Arabic text, Saheeh International translation, and transliteration.",
};

export default function QuranPage() {
  const surahs = getSurahIndex();

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 pb-16 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] py-5">
        <Link className="font-semibold tracking-tight text-[var(--green)]" href="/">
          Muslim Ayat
        </Link>
        <nav aria-label="Reader navigation" className="flex flex-wrap items-center gap-5 text-sm">
          {featureFlags.search ? <Link className="text-[var(--muted)] hover:text-[var(--green)]" href="/search">Search</Link> : null}
          {featureFlags.readerPreferences ? <Link className="text-[var(--muted)] hover:text-[var(--green)]" href="/settings">Reading settings</Link> : null}
          {featureFlags.bookmarks || featureFlags.notes ? <Link className="text-[var(--muted)] hover:text-[var(--green)]" href="/bookmarks">Saved items</Link> : null}
          {featureFlags.accountProfile || featureFlags.bookmarks || featureFlags.notes || featureFlags.readingProgress ? <Link className="text-[var(--muted)] hover:text-[var(--green)]" href="/account">Account</Link> : null}
        </nav>
      </header>

      <section className="py-12 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#72907b]">
          Read · Reflect · Return
        </p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight text-[var(--green)] sm:text-6xl">
          The Quran
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">
          Browse QUL Uthmani text alongside the Saheeh International translation and English
          transliteration. Source and rights information is shown with each edition.
        </p>
        <form action="/search" className="mt-7 flex max-w-xl gap-3" method="get" role="search">
          <label className="sr-only" htmlFor="quran-search">
            Search Arabic, translation, or transliteration
          </label>
          <input
            className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm outline-none focus:border-[#72907b]"
            id="quran-search"
            name="q"
            placeholder="Search Arabic or English text"
            type="search"
          />
          <button
            className="rounded-full bg-[var(--green)] px-6 py-3 text-sm font-medium text-white hover:bg-[#1c5547]"
            type="submit"
          >
            Search
          </button>
        </form>
      </section>

      <section aria-labelledby="surah-index-heading" className="border-t border-[var(--line)] py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#72907b]">
              114 surahs
            </p>
            <h2
              className="mt-2 text-2xl font-semibold tracking-tight text-[var(--green)]"
              id="surah-index-heading"
            >
              Choose a surah
            </h2>
          </div>
          <Link className="text-sm font-medium text-[var(--green)] hover:underline" href="/settings">
            Reading preferences
          </Link>
        </div>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {surahs.map((surah) => (
            <li key={surah.number}>
              <Link
                className="flex min-h-20 items-center gap-4 rounded-2xl border border-[var(--line)] bg-white/80 p-4 transition hover:border-[#9aaf9f] hover:bg-white"
                href={`/surah/${surah.number}`}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf0e7] text-sm font-semibold text-[var(--green)]">
                  {surah.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-[var(--green)]">
                    {surah.nameTransliteration}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--muted)]">
                    {surah.ayahCount} ayahs
                  </span>
                </span>
                {surah.nameArabic ? (
                  <span className="arabic text-lg text-[var(--green)]" dir="rtl" lang="ar">
                    {surah.nameArabic}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-8 grid gap-6">
        <FutureReleaseNote />
        <ContentSources />
      </div>
    </main>
  );
}