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
  const isMushaf = featureFlags.mushafLayout && preferences.readingMode === "mushaf";
  const arabicSize = preferences.arabicFontSize === "large" ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl";
  const headerImage =
    surah.number > 1 ? `/surah-headers/surah-${String(surah.number).padStart(3, "0")}.svg` : null;

  function navigateToAyah(ayahNumber: number) {
    setSelectedAyah(ayahNumber);
    document.getElementById(`ayah-${ayahNumber}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
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
    <main className="reader-page mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link className="reader-back-link" href="/">← All surahs</Link>
        <span className="reader-context-label">THE HOLY QURAN</span>
      </div>

      <header className="reader-surah-hero">
        <div className="reader-surah-copy">
          <p className="reader-eyebrow">SURAH {String(surah.number).padStart(3, "0")} <span>·</span> {surah.ayahCount} AYahs</p>
          <h1 className="reader-surah-title">{surah.nameTransliteration}</h1>
          <p className="reader-surah-meta">Chapter {surah.number} of 114</p>
        </div>
        <div className="reader-surah-arabic" dir="rtl" lang="ar">
          {surah.nameArabic}
        </div>
        {isMushaf && featureFlags.surahHeaders && headerImage ? (
          <Image
            alt=""
            aria-hidden="true"
            className="reader-surah-art"
            height={205}
            loading="eager"
            src={headerImage}
            width={455}
          />
        ) : null}
      </header>

      <nav aria-label="Surah navigation" className="reader-chapter-nav">
        {previousSurah ? (
          <Link href={`/surah/${previousSurah.number}`} className="reader-chapter-link">
            <span aria-hidden="true">←</span><span><small>PREVIOUS</small>{previousSurah.nameTransliteration}</span>
          </Link>
        ) : <span />}
        <span className="reader-chapter-count">{surah.number} / 114</span>
        {nextSurah ? (
          <Link href={`/surah/${nextSurah.number}`} className="reader-chapter-link reader-chapter-link-next">
            <span><small>NEXT</small>{nextSurah.nameTransliteration}</span><span aria-hidden="true">→</span>
          </Link>
        ) : <span />}
      </nav>

      <section aria-label="Reader controls" className="reader-toolbar">
        <div className="reader-toolbar-title">
          <span className="reader-toolbar-dot" />
          <span>Reading session</span>
        </div>
        <div className="reader-toolbar-actions">
          <label className="sr-only" htmlFor="jump-to-ayah">Jump to ayah</label>
          <select
            className="reader-jump-select"
            id="jump-to-ayah"
            onChange={(event) => navigateToAyah(Number(event.currentTarget.value))}
            value={selectedAyah}
          >
            {surah.ayahs.map((ayah) => (
              <option key={ayah.number} value={ayah.number}>Go to ayah {ayah.number}</option>
            ))}
          </select>
          {featureFlags.readerPreferences ? (
            <Link className="reader-settings-link" href="/settings">Aa <span>Reading settings</span></Link>
          ) : null}
        </div>
      </section>

      {(featureFlags.bookmarks || featureFlags.notes || featureFlags.readingProgress) ? (
        <div className="reader-personal-tools">
          <PersonalAyahControls ayahNumber={selectedAyah} surahNumber={surah.number} />
        </div>
      ) : null}
      {featureFlags.audio ? (
        <div className="reader-audio-panel">
          <AyahAudioPlayer
            ayahCount={surah.ayahCount}
            ayahNumber={selectedAyah}
            onAyahChange={navigateToAyah}
            surahNumber={surah.number}
          />
        </div>
      ) : null}

      <section
        aria-label={`${surah.nameTransliteration} verses`}
        className={isMushaf ? "reader-verses reader-verses-mushaf" : "reader-verses"}
        data-reading-mode={preferences.readingMode}
      >
        {surah.ayahs.map((ayah) => (
          <article
            aria-label={`Ayah ${ayah.number}`}
            className={`reader-ayah ${isMushaf ? "reader-ayah-mushaf" : ""} ${selectedAyah === ayah.number ? "reader-ayah-selected" : ""}`}
            id={`ayah-${ayah.number}`}
            key={ayah.number}
          >
            <div className="reader-ayah-topline">
              <span className="reader-ayah-number">{ayah.number}</span>
              <a
                aria-label={`Link to ayah ${ayah.number}`}
                className="reader-ayah-reference"
                href={`#ayah-${ayah.number}`}
                onClick={() => setSelectedAyah(ayah.number)}
              >
                {surah.number}:{ayah.number}
              </a>
            </div>
            <p
              className={`arabic reader-ayah-arabic ${arabicSize}`}
              dir="rtl"
              lang="ar"
            >
              {ayah.textUthmani}
            </p>
            {featureFlags.transliteration && preferences.showTransliteration && ayah.transliteration ? (
              <p className="reader-transliteration" lang="en-Latn">{ayah.transliteration}</p>
            ) : null}
            {featureFlags.translations && preferences.translationId !== "none" && ayah.translation ? (
              <p className="reader-translation">{ayah.translation}</p>
            ) : null}
            {(featureFlags.tafsir || featureFlags.wordByWord) ? (
              <div className="reader-study-aid">
                <StudyAid ayahNumber={ayah.number} surahNumber={surah.number} />
              </div>
            ) : null}
          </article>
        ))}
      </section>

      <nav aria-label="Surah navigation" className="reader-bottom-nav">
        {previousSurah ? <Link href={`/surah/${previousSurah.number}`}>← Previous surah</Link> : <span />}
        {nextSurah ? <Link href={`/surah/${nextSurah.number}`}>Next surah →</Link> : null}
      </nav>
    </main>
  );
}
