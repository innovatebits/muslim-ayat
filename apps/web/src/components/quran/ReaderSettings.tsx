"use client";

import Link from "next/link";
import {
  useReaderPreferences,
  type ReaderPreferences,
} from "@/components/quran/ReaderPreferences";

export function ReaderSettings() {
  const {
    preferences,
    updatePreference,
    isAuthenticated,
    syncStatus,
    showSignInPrompt,
    requestPreferenceSync,
    dismissSignInPrompt,
  } = useReaderPreferences();

  const syncStatusMessage = {
    checking: "Checking your account…",
    "device-only": "Preferences save automatically in this browser on this device.",
    syncing: "Syncing preferences to your account…",
    synced: "Preferences are saved and synced to your account.",
    error: "Account sync is unavailable. Your changes remain saved on this device.",
  }[syncStatus];

  return (
    <section aria-labelledby="preferences-heading" className="mt-8 space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--green)]" id="preferences-heading">
        Reading preferences
      </h1>

      <fieldset className="rounded-2xl border border-[var(--line)] bg-white/80 p-5 sm:p-7">
        <legend className="px-2 text-sm font-semibold text-[var(--green)]">Reading layout</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--line)] p-4">
            <input
              checked={preferences.readingMode === "continuous"}
              name="reading-mode"
              onChange={() => updatePreference("readingMode", "continuous")}
              type="radio"
              value="continuous"
            />
            <span>
              <span className="block text-sm font-semibold text-[var(--green)]">Continuous</span>
              <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                Read ayahs in a simple scrolling list.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--line)] p-4">
            <input
              checked={preferences.readingMode === "mushaf"}
              name="reading-mode"
              onChange={() => updatePreference("readingMode", "mushaf")}
              type="radio"
              value="mushaf"
            />
            <span>
              <span className="block text-sm font-semibold text-[var(--green)]">Mushaf-style page</span>
              <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                Read within a calm, page-like frame.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="rounded-2xl border border-[var(--line)] bg-white/80 p-5">
          <span className="block text-sm font-semibold text-[var(--green)]">Translation</span>
          <select
            aria-label="Translation"
            className="mt-3 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
            onChange={(event) =>
              updatePreference(
                "translationId",
                event.currentTarget.value as ReaderPreferences["translationId"],
              )
            }
            value={preferences.translationId}
          >
            <option value="saheeh-international">Saheeh International</option>
            <option value="none">Arabic only</option>
          </select>
          <span className="mt-2 block text-xs leading-5 text-[var(--muted)]">
            More attributed translations may be offered in future releases.
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-white/80 p-5">
          <input
            checked={preferences.showTransliteration}
            className="mt-1"
            onChange={(event) => updatePreference("showTransliteration", event.currentTarget.checked)}
            type="checkbox"
          />
          <span>
            <span className="block text-sm font-semibold text-[var(--green)]">
              Show English transliteration
            </span>
            <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
              Transliteration is a reading aid, not a translation of the Quran.
            </span>
          </span>
        </label>
      </div>

      <label className="block max-w-sm rounded-2xl border border-[var(--line)] bg-white/80 p-5">
        <span className="block text-sm font-semibold text-[var(--green)]">Arabic text size</span>
        <select
          className="mt-3 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
          onChange={(event) =>
            updatePreference(
              "arabicFontSize",
              event.currentTarget.value as ReaderPreferences["arabicFontSize"],
            )
          }
          value={preferences.arabicFontSize}
        >
          <option value="comfortable">Comfortable</option>
          <option value="large">Large</option>
        </select>
      </label>

      <div>
        <p className="text-sm text-[var(--muted)]" role="status">
          {syncStatusMessage}
        </p>
        {!isAuthenticated ? (
          <button
            className="mt-3 rounded-full border border-[var(--green)] px-4 py-2 text-sm font-medium text-[var(--green)] disabled:opacity-50"
            disabled={syncStatus === "checking"}
            onClick={requestPreferenceSync}
            type="button"
          >
            Sync preferences across devices
          </button>
        ) : null}
        {showSignInPrompt ? (
          <aside
            aria-labelledby="preference-sign-in-heading"
            className="mt-4 rounded-xl border border-[#dfe5da] bg-[#edf0e7] p-4"
            role="status"
          >
            <h2 className="text-sm font-semibold text-[var(--green)]" id="preference-sign-in-heading">
              Want to personalize your experience?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Sign in to save bookmarks, notes, reading progress and preferences across devices.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Link className="rounded-full bg-[var(--green)] px-4 py-2 text-sm font-medium text-white" href="/sign-in">
                Sign in
              </Link>
              <button
                className="rounded-full border border-[var(--green)] px-4 py-2 text-sm font-medium text-[var(--green)]"
                onClick={dismissSignInPrompt}
                type="button"
              >
                Continue reading as guest
              </button>
            </div>
          </aside>
        ) : null}
      </div>
      <Link className="inline-block text-sm font-semibold text-[var(--green)] hover:underline" href="/quran">
        Return to the Quran reader
      </Link>
    </section>
  );
}