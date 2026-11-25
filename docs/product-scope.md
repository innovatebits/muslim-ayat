# Product Scope

## Product promise

Muslim Ayat is a Quran-first reading experience. The Quran remains accessible without sign-in. Accounts unlock personalization and synchronization; they do not unlock the Quran.

## Core public experience

The following must work for signed-out visitors:

- Read the complete Quran: 114 surahs and 30 juz.
- Navigate by surah, ayah and juz.
- Switch between Mushaf-style and continuous reading layouts.
- Read available translations with clear edition and translator attribution.
- Search surah names and ayah content where supported by the indexed content.
- Listen to licensed recitations, including surah/ayah playback and basic playback controls.
- Adjust essential reader presentation such as Arabic font size, translation visibility and light/dark theme.
- Use the reader on mobile and desktop, with progressive offline support.

## Account-backed personalization

Require sign-in only for features that are saved to a user's account or synchronized across devices:

- Bookmarks and saved ayahs.
- Personal notes.
- Reading progress and resume position across devices.
- Synced preferences and profile settings.

A signed-out user should not be blocked from reading because these features exist. The interface should explain when a user action needs an account and preserve the public reading context through sign-in.

## Content integrity

- Arabic Quran text is sacred canonical content: do not generate, paraphrase or silently normalize it.
- Record the source, edition, script convention, version and license/provenance for each content dataset.
- Preserve ayah numbering and surah/juz relationships.
- Translations and tafsir are distinct editorial works; always show attribution and edition details.
- Audio recordings require appropriate rights and stable reciter/asset attribution.
- Any content update must pass structural and spot-check validation before release.

## Delivery phases

### Phase 0 — Foundation
Repository structure, design system, CI, content contracts, source/provenance policy and architecture decisions.

### Phase 1 — Public Quran reader
Verified Arabic content, surah/juz navigation, reading layouts, responsive UI and accessible controls.

### Phase 2 — Reading tools
Translations, search, recitation playback and reader preferences. Public access remains intact.

### Phase 3 — Accounts and personalization
Supabase Auth, profile/preferences, bookmarks, notes, reading progress and RLS policies.

### Phase 4 — PWA and synchronization
Offline public content, installability, carefully scoped local persistence and cross-device sync.

## Explicitly deferred

Do not add prayer times, Qibla, duas, Hifz tools, social/community features, subscriptions, ads or native mobile applications to the initial scope without a separate product decision.

## Acceptance principles

- A fresh visitor can open the site and begin reading without signing in.
- Public reading, translation, search and listening do not depend on a Supabase session.
- Personal data is never exposed across accounts.
- No unverified Quran text or unlicensed media is shipped.
- Mobile reading remains usable on narrow screens and with keyboard/screen-reader navigation.
