# Implementation Roadmap

**Status:** The selected implementation scope is complete: rights-evidence tracking, Arabic search, and public offline reliability. Resource-specific legal and subject-matter clearance remains open.
**Source:** `docs/OPEN_SOURCE_REUSE_AUDIT.md`, `docs/architecture.md`, `docs/product-scope.md`, and `apps/web/PRODUCT.md`.
**Branch:** `feature/open-source-reuse-audit`

## Direction

Improve the existing Quran-first product in place. Keep the current Bun workspace, Next.js, TypeScript, Tailwind, Supabase, IndexedDB, PWA, and Cloudflare/OpenNext architecture. Do not add a package, service, state library, or UI framework without a demonstrated need.

**Non-negotiable product contract:** Quran reading, browsing, search, listening, and public study remain available without signing in. Authentication is required only for account-owned personal data and cross-device synchronization. Canonical Quran text must never be generated, silently corrected, or modified by search normalization.

## Release gates and sequencing

### Gate 0 — content rights and release readiness

This is a governance/release gate, not a reason to stop all work on reader usability or pure algorithms.

**Status:** The evidence tracker is in place; no resource has been marked cleared.

- Maintain [`CONTENT_RIGHTS_REGISTER.md`](CONTENT_RIGHTS_REGISTER.md) as the resource-by-resource tracker for Arabic text, translation, transliteration, tafsir, word-by-word glosses, Surah header artwork, Juz boundaries, and each audio provider/reciter. It records unknowns but does not grant rights.
- For each resource record: exact edition/version, source and rightsholder, license or written permission, required attribution, permitted display/redistribution, offline/cache permission, commercial-use restrictions, and evidence/review date.
- Treat unknown or undocumented rights as **not cleared**. Do not infer permission from QUL/CDN availability or from another project's attribution.
- Do not expand datasets, add reciters, bundle audio, or cache study/audio content until the relevant resource's rights explicitly permit that use.
- Have licensing questions reviewed by an appropriate legal adviser and Quran/translation/tafsir presentation reviewed by qualified subject-matter reviewers.

**Acceptance:** every resource enabled for production distribution has an evidence-backed rights decision and rendered attribution; unresolved resources are clearly marked and excluded from any use not explicitly permitted.

### Milestone 1 — core Quran navigation: Juz

**Status:** Implemented; boundary-data rights and provenance still require verification.

**Priority:** P1 · **Estimate:** medium · **Dependency:** verified, provenance-recorded Juz boundary data.

- Add a typed Juz boundary model and pure lookup/validation helpers to the existing Quran domain/content boundaries; do not create a new package.
- Source boundaries independently from a trusted edition and record provenance. Do not copy another repository's data.
- Add a public Juz index and navigation to the appropriate ayah in the existing reader.
- Preserve Surah/ayah navigation and guest access.

**Acceptance and tests**
- Exactly 30 Juz are represented.
- Every boundary references a valid Surah/Ayah.
- Coverage is contiguous, ordered, non-overlapping, and has no missing or duplicate ayahs.
- First/last boundaries match an independently verified reference.
- Juz navigation opens the expected reader location on desktop and mobile.
- Signed-out users can use all Juz routes and controls.

### Milestone 2 — Arabic search quality

**Status:** Implemented in `packages/quran-data/src/reader.ts`; canonical Quran text remains unchanged.

**Priority:** P1 · **Estimate:** medium · **Dependency:** no new service or dependency.

- Improve query normalization and relevance scoring in the existing local Quran search implementation.
- Consider Arabic diacritic/tatweel removal and explicitly selected orthographic variants (for example alef and hamza forms) only in a query/search-index comparison representation.
- Add token-aware matching and deterministic ranking for exact phrase, word-boundary, and all-token matches.
- Keep translation and transliteration matching behavior explicit and covered by tests.
- Preserve the current result limit and stable ordering for ties unless product requirements justify a change.

**Critical integrity rule:** normalization is for matching only. The canonical Quran text returned and displayed must remain byte-for-byte unchanged. Never write normalized query/index text back into source corpus records.

**Acceptance and tests**
- Tests cover harakat, tatweel, selected letter variants, phrase/token ranking, stable ties, blank/invalid input, result limits, and translation/transliteration matches.
- Regression tests prove the canonical corpus and returned display text are unchanged.
- Search remains local and available without a session.

### Milestone 3 — dependable public offline experience

**Status:** Implemented in the service worker and offline repository; the duplicate IndexedDB Quran store was removed with a migration that preserves personal records. Cache failures no longer discard successful network responses, and the public cache has a 256-entry FIFO limit.

**Priority:** P1 · **Estimate:** small to medium · **Dependencies:** rights clearance for any additional resource being cached.

- The service-worker route cache was verified end-to-end; the previous IndexedDB public Surah writer had no reader fallback caller.
- The duplicate IndexedDB Quran cache was removed; Cache Storage owns public reader offline behavior, and the database migration preserves personal stores.
- Add explicit offline behavior for public study responses only after those resources are cleared for offline caching.
- Keep public content caches strictly separate from authenticated responses, private notes, bookmarks, profiles, and sync payloads.
- Use cache version `v3`, delete stale Muslim Ayat caches on activation, and cap the public cache at 256 entries by evicting oldest entries.

**Acceptance and tests**
- A guest can open previously visited public reader content offline.
- Public study data is cached only when the source rights permit it and the response is explicitly public.
- Private, no-store, cookie-setting, and authenticated responses are never stored in a public cache.
- Tests cover online cache fill, offline fallback, stale version/update, cache failure, and account/private-response isolation.
- Audio remains streamed and is not cached/downloaded unless recording rights and provider terms explicitly allow it.

### Milestone 4 — reader comfort and visual consistency

**Priority:** P2 · **Estimate:** small to medium · **Dependency:** design review and accessibility validation.

- Establish and apply the Muslim Ayat design tokens in `apps/web/src/app/globals.css`; keep Tailwind and the current component architecture.
- Add a deliberate dark theme (and sepia only if it offers a clear reading benefit) using semantic tokens, not page-specific color overrides.
- Improve typography hierarchy, line length, Arabic line-height, spacing, focus states, surfaces, and responsive navigation consistently across the homepage, Quran index, reader, search, and settings.
- Keep controls keyboard accessible and preserve reduced-motion support.
- Do not claim page-accurate Mushaf pagination: the current “Mushaf-style” view is a styled ayah layout, not a 604-page renderer.

**Acceptance and tests**
- Contrast is checked for text, controls, focus indicators, and interactive states in every theme.
- Reader settings remain device-usable while signed out; syncing those settings still requires authentication.
- Mobile and desktop layouts, keyboard navigation, screen-reader names, and reduced-motion behavior are checked.
- No visual change gates Quran reading behind sign-in.

### Milestone 5 — lightweight personal reading goal (separate product approval)

**Priority:** P2 · **Estimate:** medium · **Dependency:** explicit product approval and a separately reviewed database/RLS design.

- Consider one simple reading target or Khatma pace; do not introduce courses, classrooms, streak pressure, Hifz/SM-2, or a general LMS.
- Keep date/progress calculations pure and deterministic, with time/date inputs injected.
- Keep account-owned learning history separate from public Quran content.
- Any persisted personal goal/history must be authenticated, owner-scoped, protected by RLS, and covered by sync/account-switch tests.
- Do not change schema or auth behavior as part of the audit or design-system work.

**Acceptance and tests**
- Date/time-zone, inclusive target date, invalid/past date, zero/complete progress, missed-day, pause/resume, and reset cases are covered.
- Cross-account isolation and RLS are tested before persistence ships.
- The feature is optional and does not alter the core reader.

## Explicitly out of scope

- Copying AGPL-licensed Ummah Library or Bayaan Web code, UI components, datasets, or assets into this MIT repository.
- Replacing the existing stack or introducing a new backend/search service.
- Hifz/SM-2, prayer times, Qibla, adhkar, hadith browser, social/community, subscriptions, ads, playlists, highlights, courses, or LMS features without a separate product decision.
- Page-accurate Mushaf rendering until verified page/ayah mappings, fonts, rights, and product requirements exist.
- New translations, tafsir, glosses, header art, reciters, audio downloads, or offline caching without resource-specific rights clearance.

## Delivery rules

1. Implement one milestone per focused feature branch/PR.
2. Keep documentation, design foundation, and product behavior changes reviewable as separate concerns.
3. Before implementation, inspect the current branch and tests; do not assume this roadmap's file paths or behavior remain unchanged.
4. Run relevant unit tests, typecheck, lint, browser tests, production build, Quran-data validation, and database/RLS checks when applicable.
5. Report actual commands/results. Never describe an unrun check as passing.
6. Never merge to `main`, change deployment secrets, or alter production configuration without explicit approval.
