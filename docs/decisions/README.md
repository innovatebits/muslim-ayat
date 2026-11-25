# Architecture Decision Records

## ADR-001: Public Quran access; accounts only for personalization

- Status: Accepted
- Decision: Reading the Quran and core public reading tools must not require authentication. Sign-in gates account-backed personalization and synchronization only.
- Rationale: Preserve frictionless access and avoid making religious content dependent on account creation.
- Consequences: Public routes and content delivery must work without a Supabase session. Account checks belong around personal-data actions, not around the reader shell.

## ADR-002: Version-controlled canonical content; Supabase for personal data

- Status: Accepted as the initial direction
- Decision: Curated Quran text and public reference metadata are versioned and validated as content. Supabase stores user-owned data and authentication state.
- Rationale: Keep canonical content reviewable, traceable and independent of account lifecycle; apply database authorization to personal records.
- Consequences: Every content dataset needs provenance and licensing metadata. User tables require RLS and ownership tests.

## ADR-003: Keep Cloudflare adapter selection behind a compatibility spike

- Status: Proposed
- Decision: Keep the app close to standard Next.js APIs and isolate platform-specific code. Evaluate vinext and OpenNext against the actual feature set before committing to a production adapter.
- Rationale: Cloudflare currently recommends vinext for new Next.js-on-Workers apps, but it is beta; OpenNext remains documented for existing applications.
- Consequences: Do not scatter adapter-specific APIs through domain packages. Record the outcome of the compatibility spike before deployment setup is finalized.
