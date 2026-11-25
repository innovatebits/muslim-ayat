"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AyahAudioPlayer } from "@/components/audio/AyahAudioPlayer";
import type { QuranReaderSurah, QuranSurahSummary } from "@muslim-ayat/quran-data/reader";
import { cachePublicSurah } from "@/lib/offline/repository";
import { PersonalAyahControls } from "./PersonalAyahControls";
import { StudyAid } from "./StudyAid";
import { useReaderPreferences } from "./ReaderPreferences";
import { featureFlags } from "@/lib/features";

type SurahReaderProps = {
  surah: QuranReaderSurah;
  previousSurah?: QuranSurahSummary;
  nextSurah?: QuranSurahSummary;
};

export function SurahReader({ surah, previousSurah, nextSurah }: SurahReaderProps) {
  const { preferences } = useReaderPreferences();
  const [selectedAyah, setSelectedAyah] = useState(1);
  const isMushaf = preferences.readingMode === "mushaf";
  const arabicSize = preferences.arabicFontSize === "large" ? "text-4xl" : "text-3xl";
  const headerImage =
    surah.number > 1 ? `/surah-headers/surah-${String(surah.number).padStart(3, "0")}.svg` : null;

  function navigateToAyah(ayahNumber: number) {
    setSelectedAyah(ayahNumber);
    document.getElementById(`ayah-${ayahNumber}`)?.scrollIntoView({ behavior: "smooth" });
    window.history.replaceState(null, "", `#ayah-${ayahNumber}`);
  }

  useEffect(() => {
    if (featureFlags.offline) void cachePublicSurah(surah).catch(() => undefined);
    const frame = window.requestAnimationFrame(() => {
      const ayahNumber = Number(window.location.hash.match(/^#ayah-(\d+)$/u)?.[1]);
      setSelectedAyah(
        Number.isInteger(ayahNumber) && ayahNumber >= 1 && ayahNumber <= surah.ayahs.length
          ? ayahNumber
          : 1,
      );
    });

    return () => window.cancelAnimationFrame(frame);
  }, [surah]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#72907b]">
            {surah.ayahCount} ayahs
          </p>
          {isMushaf && headerImage ? (
            <Image
              alt=""
              aria-hidden="true"
              className="mx-auto mb-4 mt-3 h-auto w-full max-w-[28rem]"
              height={205}
              loading="eager"
              src={headerImage}
              width={455}
            />
          ) : null}
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--green)] sm:text-4xl">
            {surah.nameTransliteration}
          </h1>
          {surah.nameArabic ? (
            <p className="arabic mt-2 text-2xl text-[var(--muted)]" dir="rtl" lang="ar">
              {surah.nameArabic}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor="jump-to-ayah">
            Jump to ayah
          </label>
          <select
            className="rounded-full border border-[var(--line)] bg-white px-4 py-2.5 text-sm"
            id="jump-to-ayah"
            onChange={(event) => navigateToAyah(Number(event.currentTarget.value))}
            value={selectedAyah}
          >
            {surah.ayahs.map((ayah) => (
              <option key={ayah.number} value={ayah.number}>
                Ayah {ayah.number}
              </option>
            ))}
          </select>
          {featureFlags.readerPreferences ? (
            <Link className="rounded-full border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--green)]" href="/settings">Reading settings</Link>
          ) : null}
        </div>
      </div>

      <nav aria-label="Surah navigation" className="mb-6 flex items-center justify-between gap-4">
        {previousSurah ? (
          <Link className="text-sm font-medium text-[var(--green)] hover:underline" href={`/surah/${previousSurah.number}`}>
            ← {previousSurah.nameTransliteration}
          </Link>
        ) : (
          <span />
        )}
        {nextSurah ? (
          <Link className="text-sm font-medium text-[var(--green)] hover:underline" href={`/surah/${nextSurah.number}`}>
            {nextSurah.nameTransliteration} →
          </Link>
        ) : null}
      </nav>

      {(featureFlags.bookmarks || featureFlags.notes || featureFlags.readingProgress) ? (
        <PersonalAyahControls ayahNumber={selectedAyah} surahNumber={surah.number} />
      ) : null}
      {featureFlags.audio ? (
        <AyahAudioPlayer
          ayahCount={surah.ayahCount}
          ayahNumber={selectedAyah}
          onAyahChange={navigateToAyah}
          surahNumber={surah.number}
        />
      ) : null}

      <div
        className={
          isMushaf
            ? "mx-auto max-w-3xl rounded-3xl border-4 border-[#e7e3d2] bg-[#fffdf5] px-5 py-7 shadow-sm sm:px-10 sm:py-10"
            : "space-y-4"
        }
        data-reading-mode={preferences.readingMode}
      >
        {surah.ayahs.map((ayah) => (
          <article
            aria-label={`Ayah ${ayah.number}`}
            className={
              isMushaf
                ? "border-b border-dotted border-[#d9d4c3] py-5 last:border-0"
                : "rounded-2xl border border-[var(--line)] bg-white/80 p-5 sm:p-7"
            }
            id={`ayah-${ayah.number}`}
            key={ayah.number}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="grid size-8 place-items-center rounded-full bg-[#edf0e7] text-xs font-semibold text-[var(--green)]">
                {ayah.number}
              </span>
              <a
                aria-label={`Link to ayah ${ayah.number}`}
                className="text-xs text-[var(--muted)] hover:text-[var(--green)]"
                href={`#ayah-${ayah.number}`}
              >
                {surah.number}:{ayah.number}
              </a>
            </div>
            <p
              className={`arabic ${arabicSize} text-right leading-[2.1] text-[var(--green)] sm:leading-[2.2]`}
              dir="rtl"
              lang="ar"
            >
              {ayah.textUthmani}
            </p>
            {featureFlags.transliteration && preferences.showTransliteration && ayah.transliteration ? (
              <p className="mt-4 text-sm leading-6 text-[#49715d]" lang="en-Latn">
                {ayah.transliteration}
              </p>
            ) : null}
            {featureFlags.translations && preferences.translationId !== "none" && ayah.translation ? (
              <p className="mt-3 text-sm leading-7 text-[var(--ink)] sm:text-base">
                {ayah.translation}
              </p>
            ) : null}
            {(featureFlags.tafsir || featureFlags.wordByWord) ? (
              <StudyAid ayahNumber={ayah.number} surahNumber={surah.number} />
            ) : null}
          </article>
        ))}
      </div>

      <nav aria-label="Surah navigation" className="mt-8 flex items-center justify-between gap-4">
        {previousSurah ? (
          <Link className="text-sm font-medium text-[var(--green)] hover:underline" href={`/surah/${previousSurah.number}`}>
            ← Previous surah
          </Link>
        ) : (
          <span />
        )}
        {nextSurah ? (
          <Link className="text-sm font-medium text-[var(--green)] hover:underline" href={`/surah/${nextSurah.number}`}>
            Next surah →
          </Link>
        ) : null}
      </nav>
    </div>
  );
}