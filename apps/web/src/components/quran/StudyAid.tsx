"use client";

import { useEffect, useState } from "react";
import { QuranStudyAyahSchema, type QuranStudyAyah } from "@muslim-ayat/quran-data";
import { featureFlags } from "@/lib/features";

type StudyAidProps = {
  surahNumber: number;
  ayahNumber: number;
};

type LoadStatus = "idle" | "loading" | "ready" | "error";

export function StudyAid({ surahNumber, ayahNumber }: StudyAidProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [studyAyah, setStudyAyah] = useState<QuranStudyAyah | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const panelId = `study-${surahNumber}-${ayahNumber}`;

  useEffect(() => {
    if (!isOpen || studyAyah) return;

    const controller = new AbortController();
    let active = true;
    void fetch(`/api/study/${surahNumber}/${ayahNumber}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Study content is unavailable.");
        const result = QuranStudyAyahSchema.safeParse((await response.json()) as unknown);
        if (!result.success) throw new Error("Study content did not pass validation.");
        return result.data;
      })
      .then((result) => {
        if (!active) return;
        setStudyAyah(result);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!active || (error instanceof Error && error.name === "AbortError")) return;
        setStatus("error");
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [ayahNumber, isOpen, studyAyah, surahNumber]);

  if (!featureFlags.tafsir && !featureFlags.wordByWord) return null;

  return (
    <section className="mt-5 border-t border-[var(--line)] pt-4">
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="text-sm font-semibold text-[var(--green)] hover:underline"
        onClick={() => {
          if (!isOpen && !studyAyah) setStatus("loading");
          setIsOpen((open) => !open);
        }}
        type="button"
      >
        {featureFlags.tafsir && featureFlags.wordByWord ? "Tafsir and word-by-word study" : featureFlags.tafsir ? "Tafsir" : "Word-by-word study"} {isOpen ? "−" : "+"}
      </button>
      {isOpen ? (
        <div className="mt-4 space-y-5" id={panelId}>
          {status === "loading" || status === "idle" ? (
            <p className="text-sm text-[var(--muted)]" role="status">Loading study resources…</p>
          ) : status === "error" ? (
            <p className="text-sm text-[var(--muted)]" role="status">
              Study resources are unavailable right now. Quran reading remains available.
            </p>
          ) : studyAyah ? (
            <>
              {featureFlags.tafsir ? (
              <section aria-labelledby={`${panelId}-tafsir-title`}>
                <h3 className="font-semibold text-[var(--green)]" id={`${panelId}-tafsir-title`}>
                  Tafsir · Abridged Explanation of the Quran
                </h3>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Commentary, not Quran text. Rights status: {studyAyah.sources.tafsir.rightsStatus}.{" "}
                  <a className="underline" href={studyAyah.sources.tafsir.url} rel="noreferrer" target="_blank">
                    Source details
                  </a>
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--ink)]">{studyAyah.tafsir}</p>
              </section>
              ) : null}
              {featureFlags.wordByWord ? (
              <section aria-labelledby={`${panelId}-words-title`}>
                <h3 className="font-semibold text-[var(--green)]" id={`${panelId}-words-title`}>
                  English word-by-word glosses
                </h3>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Glosses follow the source’s word positions; no missing text is reconstructed. Rights status: {studyAyah.sources.wordByWord.rightsStatus}.{" "}
                  <a className="underline" href={studyAyah.sources.wordByWord.url} rel="noreferrer" target="_blank">
                    Source details
                  </a>
                </p>
                <ol className="mt-3 flex flex-wrap gap-2">
                  {studyAyah.words.map((word) => (
                    <li key={word.number} className="rounded-lg bg-[#f7f6ef] px-3 py-2 text-sm">
                      <span className="mr-2 text-xs text-[var(--muted)]">{word.number}</span>
                      {word.gloss ?? <span className="text-[var(--muted)]">No gloss in source</span>}
                    </li>
                  ))}
                </ol>
              </section>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}