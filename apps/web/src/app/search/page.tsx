import type { Metadata } from "next";
import Link from "next/link";
import { searchQuran } from "@muslim-ayat/quran-data/reader";

export const metadata: Metadata = {
  title: "Search the Quran",
  description: "Search Quran Arabic text, Saheeh International translation, and transliteration.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const results = query ? searchQuran(query) : [];

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 pb-16 pt-6 sm:px-8">
      <header className="mb-10 flex items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
        <Link className="text-sm font-medium text-[var(--green)] hover:underline" href="/quran">
          ← Quran index
        </Link>
        <Link className="text-sm text-[var(--muted)] hover:text-[var(--green)]" href="/settings">
          Reading settings
        </Link>
      </header>

      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#72907b]">
          Arabic · Translation · Transliteration
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--green)]">
          Search the Quran
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Search the selected Arabic text, Saheeh International translation, and English
          transliteration. Results link directly to the ayah.
        </p>
        <form action="/search" className="mt-6 flex max-w-2xl gap-3" method="get" role="search">
          <label className="sr-only" htmlFor="search-query">
            Search Arabic, translation, or transliteration
          </label>
          <input
            className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm outline-none focus:border-[#72907b]"
            defaultValue={query}
            id="search-query"
            name="q"
            placeholder="Enter a word or phrase"
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

      {query ? (
        <section aria-live="polite" className="mt-10">
          <h2 className="text-sm font-semibold text-[var(--green)]">
            {results.length} {results.length === 1 ? "result" : "results"} for “{query}”
          </h2>
          {results.length ? (
            <ol className="mt-4 space-y-4">
              {results.map((result) => (
                <li key={`${result.surahNumber}:${result.ayahNumber}`}>
                  <article className="rounded-2xl border border-[var(--line)] bg-white/80 p-5 sm:p-7">
                    <p
                      className="arabic text-right text-2xl leading-[2] text-[var(--green)]"
                      dir="rtl"
                      lang="ar"
                    >
                      {result.textUthmani}
                    </p>
                    {result.transliteration ? (
                      <p className="mt-3 text-sm text-[#49715d]" lang="en-Latn">
                        {result.transliteration}
                      </p>
                    ) : null}
                    {result.translation ? (
                      <p className="mt-2 text-sm leading-6 text-[var(--ink)]">{result.translation}</p>
                    ) : null}
                    <Link
                      className="mt-4 inline-block text-sm font-semibold text-[var(--green)] hover:underline"
                      href={`/surah/${result.surahNumber}#ayah-${result.ayahNumber}`}
                    >
                      {result.surahName} · Ayah {result.ayahNumber}
                    </Link>
                  </article>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 rounded-2xl border border-[var(--line)] bg-white/70 p-5 text-sm text-[var(--muted)]">
              No matching ayahs found. Try another word or phrase.
            </p>
          )}
        </section>
      ) : null}
    </main>
  );
}