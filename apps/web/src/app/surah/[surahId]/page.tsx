import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentSources } from "@/components/quran/ContentSources";
import { SurahReader } from "@/components/quran/SurahReader";
import { getSurah, getSurahIndex } from "@muslim-ayat/quran-data/reader";

export const dynamic = "force-static";

export async function generateMetadata({ params }: { params: Promise<{ surahId: string }> }): Promise<Metadata> {
  const { surahId } = await params;
  const surah = /^\d+$/u.test(surahId) ? getSurah(Number(surahId)) : undefined;
  return {
    title: surah ? `${surah.nameTransliteration} · Surah ${surah.number}` : "Surah reader",
    description: surah
      ? `Read ${surah.nameTransliteration} in Arabic with separately attributed translation and transliteration.`
      : "Read Quran ayahs with separately attributed translation and transliteration.",
  };
}

export function generateStaticParams() {
  return getSurahIndex().map((surah) => ({ surahId: String(surah.number) }));
}

export default async function SurahPage({ params }: { params: Promise<{ surahId: string }> }) {
  const { surahId } = await params;
  if (!/^\d+$/.test(surahId)) notFound();

  const surahNumber = Number(surahId);
  const surah = getSurah(surahNumber);
  if (!surah) notFound();

  const surahs = getSurahIndex();
  const previousSurah = surahs[surahNumber - 2];
  const nextSurah = surahs[surahNumber];

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 pb-16 pt-6 sm:px-8">
      <header className="mb-10 flex items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
        <Link className="text-sm font-medium text-[var(--green)] hover:underline" href="/quran">
          ← All surahs
        </Link>
        <nav aria-label="Reader navigation" className="flex items-center gap-5 text-sm">
          <Link className="text-[var(--muted)] hover:text-[var(--green)]" href="/search">
            Search
          </Link>
          <Link className="text-[var(--muted)] hover:text-[var(--green)]" href="/settings">
            Settings
          </Link>
          <Link className="text-[var(--muted)] hover:text-[var(--green)]" href="/bookmarks">
            Bookmarks
          </Link>
          <Link className="text-[var(--muted)] hover:text-[var(--green)]" href="/account">
            Account
          </Link>
        </nav>
      </header>

      <SurahReader nextSurah={nextSurah} previousSurah={previousSurah} surah={surah} />

      <div className="mt-10">
        <ContentSources />
      </div>
    </main>
  );
}