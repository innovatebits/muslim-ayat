"use client";

import { useEffect, useRef, useState } from "react";
import { featureFlags } from "@/lib/features";
import {
  getAyahAudioUrl,
  QURAN_AUDIO_RECITERS,
} from "@muslim-ayat/quran-data/audio";

type AyahAudioPlayerProps = {
  surahNumber: number;
  ayahNumber: number;
  ayahCount: number;
  onAyahChange: (ayahNumber: number) => void;
};

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];

export function AyahAudioPlayer({
  surahNumber,
  ayahNumber,
  ayahCount,
  onAyahChange,
}: AyahAudioPlayerProps) {
  const [reciterId, setReciterId] = useState(QURAN_AUDIO_RECITERS[0]!.identifier);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [repeat, setRepeat] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioEnabled = featureFlags.audio;
  const reciter = QURAN_AUDIO_RECITERS.find((item) => item.identifier === reciterId);
  const audioUrl = getAyahAudioUrl(surahNumber, ayahNumber, reciterId);
  const unavailable = audioUrl !== undefined && failedUrl === audioUrl;

  useEffect(() => {
    const updateOnlineState = () => setIsOnline(navigator.onLine);
    const frame = window.requestAnimationFrame(updateOnlineState);
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  if (!audioEnabled) {
    return (
      <p className="mt-5 rounded-xl border border-[var(--line)] bg-white/70 p-4 text-sm text-[var(--muted)]" role="status">
        Recitation streaming is disabled for this deployment.
      </p>
    );
  }

  return (
    <section aria-label="Ayah recitation" className="mt-5 rounded-xl border border-[var(--line)] bg-white/70 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-[var(--ink)]" htmlFor={`reciter-${surahNumber}`}>
          Reciter
          <select
            className="mt-2 block w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5"
            id={`reciter-${surahNumber}`}
            onChange={(event) => setReciterId(event.currentTarget.value)}
            value={reciterId}
          >
            {QURAN_AUDIO_RECITERS.map((item) => (
              <option key={item.identifier} value={item.identifier}>
                {item.englishName} · {item.style}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-[var(--ink)]" htmlFor={`playback-rate-${surahNumber}`}>
          Playback speed
          <select
            className="mt-2 block w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5"
            id={`playback-rate-${surahNumber}`}
            onChange={(event) => {
              const rate = Number(event.currentTarget.value);
              setPlaybackRate(rate);
              if (audioRef.current) audioRef.current.playbackRate = rate;
            }}
            value={playbackRate}
          >
            {PLAYBACK_RATES.map((rate) => (
              <option key={rate} value={rate}>
                {rate}×
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--green)] disabled:opacity-50"
          disabled={ayahNumber <= 1}
          onClick={() => onAyahChange(ayahNumber - 1)}
          type="button"
        >
          Previous ayah
        </button>
        <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
          <input checked={repeat} onChange={(event) => setRepeat(event.currentTarget.checked)} type="checkbox" />
          Repeat ayah
        </label>
        <button
          className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--green)] disabled:opacity-50"
          disabled={ayahNumber >= ayahCount}
          onClick={() => onAyahChange(ayahNumber + 1)}
          type="button"
        >
          Next ayah
        </button>
      </div>

      {isOnline && audioUrl ? (
        <audio
          key={audioUrl}
          ref={audioRef}
          aria-label={`Recitation for ayah ${ayahNumber}`}
          className="mt-4 w-full"
          controls
          loop={repeat}
          onError={() => {
            if (audioUrl) setFailedUrl(audioUrl);
          }}
          onLoadedMetadata={(event) => {
            event.currentTarget.playbackRate = playbackRate;
            setFailedUrl(null);
          }}
          preload="none"
          src={audioUrl}
        />
      ) : null}

      <p aria-live="polite" className="mt-3 text-xs leading-5 text-[var(--muted)]" role="status">
        {!isOnline
          ? "Audio streaming needs an internet connection and is not available offline."
          : unavailable
            ? "This stream is unavailable right now. Try another reciter or continue reading."
            : `${reciter?.englishName ?? "Selected reciter"} streamed via AlQuran Cloud CDN. Rights status is unknown; audio is not bundled.`}
      </p>
      <a
        className="mt-2 inline-block text-xs font-medium text-[var(--green)] underline underline-offset-2"
        href="https://alquran.cloud/cdn"
        rel="noreferrer"
        target="_blank"
      >
        AlQuran Cloud CDN source and format details
      </a>
    </section>
  );
}