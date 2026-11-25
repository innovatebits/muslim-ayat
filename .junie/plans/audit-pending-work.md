---
sessionId: session-261125-170757-zgd5
---

# Requirements

### Overview & Goals
Implement the user-approved subset of `docs/OPEN_SOURCE_REUSE_AUDIT.md`: create rights-evidence tracking, improve local Arabic search, and validate/fix public-reader offline reliability. Preserve the completed status review, keep canonical Quran text unchanged, and do not treat a tracking workflow as rights clearance.

### Pending by priority
- **P0 — Rights evidence tracking:** provide a resource-by-resource evidence workflow for the Arabic edition, translation, transliteration, tafsir, word-by-word glosses, header artwork, and recitation audio. Capture attribution and display/redistribution/offline permissions plus review state; unknown rights remain uncleared pending legal and subject-matter review.
- **P1 — Search:** improve Arabic normalization and relevance ranking in existing local search, with tests and no changes to canonical Quran text.
- **P1 — Offline reliability:** verify public reader caching end-to-end, decide whether to wire or remove the unused IndexedDB Quran cache path, and add cache lifecycle/isolation tests. Study-response caching remains gated on resource-specific rights clearance.
- **P2 — Conditional:** reader theme/comfort work requires design and accessibility review; a simple reading goal/Khatma requires explicit product approval and separately reviewed authenticated persistence/RLS design.

### Status corrections and exclusions
- Juz navigation is no longer missing: current code includes boundary data/helpers, a public `/juz` page, and E2E tests; the Juz plan marks its data and UI stages complete. Boundary licensing is still unknown, and the audit/roadmap status should be reconciled.
- Hifz/SM-2, broad worship/LMS features, playlists/highlights, stack changes, and AGPL code/data reuse are explicitly out of scope, not pending audit work.

# Technical Design

### Current implementation evidence
- `docs/OPEN_SOURCE_REUSE_AUDIT.md` contains the original P0–P2 roadmap; `docs/IMPLEMENTATION_ROADMAP.md` expands sequencing and acceptance criteria.
- Juz exists in `packages/quran-data/src/juz.ts`, `apps/web/src/app/juz/page.tsx`, and `apps/web/e2e/juz.spec.ts`; `.junie/plans/juz-navigation.md` has completed markers for its data and UI stages.
- `packages/quran-data/src/reader.ts` currently normalizes NFKC/case/selected diacritics and does substring matching, supporting the audit's search-improvement item as still open.
- `apps/web/public/sw.js` caches public Quran routes/assets but does not include the study API path; this supports the remaining offline-study and end-to-end cache-validation work.

### Scope
Implement only the three milestones explicitly selected by the user. Do not mark any resource cleared without documented evidence and appropriate review; do not cache study responses without resource-specific rights clearance. Keep reader ergonomics and reading goals conditional, and leave the listed exclusions out of scope.

# Delivery Steps

### ✓ Step 1: Cross-check audit items against current repository state
The audit's recommendations are classified against the current source and project plans.
- Compare P0–P2 items in `docs/OPEN_SOURCE_REUSE_AUDIT.md` with `docs/IMPLEMENTATION_ROADMAP.md`.
- Confirm which Juz deliverables exist in the Quran data package, public route, tests, and `.junie/plans/juz-navigation.md`.
- Verify the search and public-cache gaps in `packages/quran-data/src/reader.ts` and `apps/web/public/sw.js`.

### ✓ Step 2: Present the prioritized pending list and caveats
A concise status summary distinguishes open work, completed work, prerequisites, and exclusions.
- List rights clearance as the P0 release gate and search/offline reliability as remaining P1 work.
- Mark reader ergonomics and reading goals as conditional P2 decisions with their stated prerequisites.
- Note that Juz implementation appears complete while licensing remains open, and identify excluded features as not pending.

### ✓ Step 3: Revise plan for approved implementation scope
The plan records the three user-approved milestones and their boundaries before implementation begins.
- Preserve the completed audit-review steps and conditional/excluded scope.
- Clarify that rights tracking records evidence and review status but does not establish clearance.

### ✓ Step 4: Establish the rights-evidence tracking workflow
An auditable resource inventory captures what must be verified without asserting unsupported permissions.
- Cover the Arabic edition, translation, transliteration, tafsir, word-by-word glosses, header artwork, and recitation audio.
- Track source, rights-holder/license evidence, attribution, display/redistribution/offline permissions, and legal/subject-matter review status; keep unknowns uncleared.

### ✓ Step 5: Improve local Arabic search
Local search handles Arabic input more usefully while canonical text remains byte-for-byte unchanged.
- Inspect existing reader implementation and tests, then define normalization and relevance behavior with edge cases.
- Add or update tests for normalization, ranking, and canonical-text preservation.

### ✓ Step 6: Validate and improve offline reader reliability
Public reader caching is verified end-to-end and the unused IndexedDB path is deliberately resolved.
- Inspect service worker and cache implementation; test online/offline behavior, lifecycle, and isolation.
- Wire or remove the IndexedDB Quran cache path based on repository evidence; do not add study-response caching absent rights clearance.