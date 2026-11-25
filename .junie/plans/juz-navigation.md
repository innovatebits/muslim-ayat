# Juz Navigation Plan

## Requirements

### Overview & Goals
Implement the next roadmap milestone: validated public Juz navigation using provenance-recorded boundaries, reusing Muslim Ayat's Quran-data and reader architecture.

### Scope
- Add the 30 Juz start/end references and typed lookup/validation helpers within existing Quran packages.
- Record Quran.com Content API v4 as the primary source and Quran411's Juz breakdown as an independent cross-check; retain source and retrieval details and do not infer a data license.
- Add a public `/juz` index that links each Juz to its first ayah in the existing Surah reader.
- Preserve guest access, existing Surah/ayah navigation, Quran text bytes, feature flags, authentication behavior, database schema, and current stack.
- Do not add runtime API calls, new packages, or copied reference-project code/datasets.

### Acceptance Criteria
- Exactly 30 ordered, unique Juz ranges exist; each boundary is a valid ayah in the current 114-surah, 6,236-ayah corpus.
- Ranges are contiguous, ordered, non-overlapping, and cover every ayah from 1:1 through 114:6 exactly once.
- Boundary starts and ends match the independently checked Quran.com API and Quran411 references.
- The public Juz index exposes all boundaries and links to the correct Surah/Ayah location.
- Signed-out users can navigate from `/quran` to `/juz` and into the reader; existing Surah navigation remains available.
- The data record preserves provenance and explicitly leaves licensing unverified.

## Technical Design

### Verified Sources
- Primary: Quran.com Content API v4 Juz metadata, `https://api.quran.com/api/v4/juzs`.
- Cross-check: Quran411 Juz breakdown, `https://quran411.com/juz-breakdown`.
- Quran.com currently returns duplicate records per `juz_number`; the retrieved duplicates have identical mappings. Compare duplicate mappings before selecting one unique boundary per number 1–30. Boundary facts are used as static metadata only; the application must not call this API at runtime.
- No license or redistribution grant was established by this source review. Preserve the source references and leave licensing status explicitly unknown pending appropriate review.

### Proposed Changes
- Add a strict schema for a Juz boundary resource and validate references against `SURAH_AYAH_COUNTS`.
- Add pure helpers for Juz index lookup, number lookup, and locating a Juz by ayah reference.
- Store the 30 verified ranges in a dedicated data file with source URL, independent verification URL, edition/context, retrieval date, and unknown license status.
- Add `/juz` as a public server-rendered index; link each item to `/surah/<surah>#ayah-<ayah>` and expose a Juz link from the Quran index.
- Ensure the reader resolves an incoming ayah fragment and scrolls to the corresponding existing ayah without changing canonical Quran text.

### Testing
- Schema tests for malformed ranges, invalid surahs/ayahs, ordering, duplicates, gaps, overlaps, and corpus coverage.
- Reference fixtures assert all 30 starts/ends, including 1:1, 2:142, 2:253, 78:1, and 114:6.
- Reader tests prove lookup boundaries and source references; UI/E2E tests verify public links, direct fragment navigation, guest use, and desktop/mobile behavior.
- Run focused Quran-data and web tests, data validation, typecheck, lint, E2E, and build as applicable; report only commands actually run.

## Delivery Steps

### ✓ Step 1: Add verified Juz boundaries and domain helpers
Introduce the strict boundary dataset, provenance, range validator, lookup helpers, and unit tests before adding UI.

- Confirm all 30 records against the verified source boundary table.
- Validate contiguous coverage against the canonical corpus without rewriting Quran content.
- Keep licensing status unknown and do not add an online API dependency.

### ✓ Step 2: Add public Juz index and ayah navigation
Expose Juz navigation on existing public Quran routes without changing access or existing navigation behavior.

- Add the `/juz` index and a link from `/quran`.
- Link each Juz to its start ayah in the existing Surah reader.
- Ensure direct ayah fragments select and scroll to the requested ayah.
- Add component and E2E coverage for guest, desktop, and mobile flows.

### ✓ Step 3: Validate and review the milestone
Run focused and broader relevant checks, inspect the final diff, and prepare the milestone for a separate PR.

- Run Quran-data tests, web tests, Quran-data validation, typecheck, lint, E2E, and build as appropriate.
- Confirm no auth, feature-flag, schema, stack, or Quran text changes were introduced.
- Record actual test outcomes and any remaining external review needs.