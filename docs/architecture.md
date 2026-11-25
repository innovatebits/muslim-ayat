# Architecture

## Status

Proposed foundation for the initial implementation. This document records boundaries and constraints; it does not imply that the application has been scaffolded or that deployment compatibility has been proven.

## Product invariants

1. Quran reading is public and never requires an account.
2. Reading, translations, search, and listening remain usable while signed out.
3. Authentication is required only for account-backed personalization and synchronization.
4. Canonical Quran text and reference metadata are curated, versioned content. They are not mutable user records.
5. Personal user data must be isolated by Supabase Row Level Security (RLS).

## Initial stack

- Runtime/package manager: Bun.
- Monorepo: Bun Workspaces; introduce Turborepo task orchestration where it adds value.
- Web: Next.js App Router, React, TypeScript.
- UI: Tailwind CSS, shadcn/ui, Radix primitives.
- Validation: Zod at external-data and mutation boundaries.
- Tests: Vitest for unit/integration tests; Playwright for critical browser journeys.
- Backend/auth: Supabase Auth and Postgres.
- Hosting: Cloudflare.
- CI: GitHub Actions.

Keep the first implementation a small monorepo. Do not create services or packages without a concrete consumer.

## Repository boundaries

- `apps/web`: public website, PWA shell, routes, page composition and application adapters.
- `packages/ui`: reusable accessible UI primitives and design tokens.
- `packages/quran`: Quran domain types, surah/ayah/juz navigation, content contracts and pure reader logic.
- `packages/config`: shared TypeScript, lint and test configuration only when genuinely shared.
- `supabase/migrations`: reviewed SQL migrations, indexes, constraints and RLS policies.
- `docs`: product scope, architecture decisions, data provenance and operational notes.

Quran content should have an explicit source, license/provenance, edition/version and validation process before it is bundled or imported. Never fabricate Arabic text, translations, tafsir, recitation metadata or attribution.

## Runtime and data flow

### Public Quran experience

- Public routes render without a session.
- Quran content is read from a versioned content source and may be cached aggressively when the content version is immutable.
- Translation and tafsir metadata must retain attribution and licensing information.
- Audio playback initially consumes properly licensed external audio sources; do not proxy or redistribute recordings without rights.

### Personalization

- The browser uses the Supabase publishable/anon key only.
- Supabase Auth establishes the user identity.
- User-owned records carry an owner identifier and are protected by RLS policies that enforce ownership for SELECT, INSERT, UPDATE and DELETE.
- Never expose the Supabase service-role key to browser code.
- Validate all writes at the application boundary and enforce authorization again in the database.
- Anonymous local preferences or temporary state must not be represented as a signed-in account feature.

### Offline/PWA

- Make the public reader resilient to intermittent connectivity.
- Cache only explicitly selected, versioned public content and static application assets.
- Keep cache invalidation/versioning explicit.
- Personal data sync is a separate concern from public Quran availability; define conflict handling before implementing cross-device sync.

## Suggested initial data domains

Public/versioned content:
- Surah metadata and ordering.
- Ayah text and numbering.
- Juz and other navigation references.
- Translation editions and attribution.
- Tafsir editions and attribution.
- Reciter and audio-asset metadata.

User-owned Supabase data (later migrations):
- Profiles and account preferences.
- Bookmarks.
- Notes.
- Reading progress.
- Saved reader settings.

Do not create these tables until their corresponding user-facing workflows and ownership rules are specified.

## Quality and security gates

- Type-check and lint in CI.
- Unit-test Quran numbering/navigation and parsing logic.
- Test public reading routes with no authenticated session.
- Test that one user cannot read or mutate another user's personal records.
- Add Playwright journeys for public reading and sign-in-gated personalization.
- Keep secrets in local environment files or deployment secret stores; commit only an `.env.example` containing placeholders.
- Verify licenses and provenance for every Quran, translation, tafsir and audio dataset before release.

## Cloudflare deployment decision

Cloudflare's current documentation recommends vinext for new Next.js applications on Workers and describes OpenNext as a maintenance path for existing OpenNext apps. Vinext is beta. Keep the application framework-standard and isolate platform-specific bindings so the deployment adapter can be selected and tested without spreading adapter-specific code through domain packages.

Before selecting an adapter, run a small compatibility spike covering App Router, required Next.js features, Supabase server/client usage, local development, build output, caching and PWA asset delivery. Do not make a production deployment promise until that spike passes.

## Initial implementation sequence

1. Establish workspace, formatting, linting, type-checking and CI.
2. Create the public web shell and design tokens.
3. Define validated Quran content contracts and source/provenance documentation.
4. Implement the public reader and navigation using verified content.
5. Add translation selection, search and audio playback.
6. Add Supabase authentication and RLS-backed personalization only after public reading works independently.
7. Add offline behavior and sync with explicit cache and conflict policies.
