# Architecture

## Status

This document describes the implementation in the repository. It is the architectural reference for the current web application; proposed or future work is labelled explicitly.

## Product principles

1. **Public Quran access:** reading the Quran is available without an account. Authentication gates personal data and cross-device synchronization, never the Quran itself.
2. **Content integrity:** canonical Arabic and reference metadata are versioned application content, not user-editable records. Never generate, silently repair or substitute Quran text.
3. **Explicit provenance:** every imported resource retains its source, edition, checksum and rights status. Unknown rights are not permission to redistribute.
4. **Private personal data:** account-owned data is protected at both the application boundary and PostgreSQL Row Level Security (RLS).
5. **Offline separation:** public-content caching and private-data synchronization are separate systems with separate cache and ownership rules.
6. **Configurable capabilities:** optional product capabilities and authentication methods are independently controlled by centralized feature flags. Hiding a feature in the UI is not an authorization boundary; server actions and routes must enforce the same flag.

## Technology

| Concern | Implementation |
|---|---|
| Runtime and package manager | Bun 1.4.5 |
| Monorepo | Bun workspaces and Turborepo |
| Web application | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS |
| Validation | Zod |
| Authentication and database | Supabase Auth and PostgreSQL |
| Local persistence | IndexedDB |
| PWA | Web app manifest and service worker |
| Hosting | Cloudflare Workers |
| Next.js adapter | OpenNext |
| Tests | Vitest, Playwright and Supabase pgTAP |
| CI/CD | GitHub Actions |

The Cloudflare adapter is an implementation choice, not a domain dependency. Keep Cloudflare-specific configuration inside the web application and deployment workflow.

## Repository structure

- `apps/web`: Next.js routes, page composition, PWA integration, Supabase client factories, server actions and UI components.
- `packages/quran-data`: versioned Quran corpus, companion translations and transliteration, Surah metadata, study resources, audio references, provenance and import/validation logic. It has no Supabase or Cloudflare dependency.
- `packages/shared`: shared schemas and types, including reader preference validation.
- `packages/database`: generated/maintained Supabase database types.
- `packages/ui`: reusable UI primitives.
- `packages/quran`: Quran domain types and contracts retained for domain-level reuse.
- `scripts`: QUL import, validation, derived-index and PWA asset generation.
- `supabase/migrations`: schema, indexes, RPC synchronization functions and RLS policies.
- `supabase/tests`: database security and synchronization tests.
- `docs`: product scope, architecture decisions and operational guidance.

## Public Quran content

### Content pipeline

Quran resources are sourced from the Quranic Universal Library (QUL) and other explicitly recorded sources. QUL is treated as a downloadable resource catalogue, not as a runtime API dependency.

The current corpus includes:
- QUL Uthmani Simple Arabic script (Hafs; ayah-by-ayah).
- Surah metadata and names.
- Saheeh International English translation.
- English Tajweed transliteration.
- Abridged Explanation of the Quran tafsir export.
- English word-by-word glosses.
- Surah header SVG assets.
- External per-ayah audio references.

The import scripts preserve source exports, validate resource structure and record SHA-256 checksums. The generated Surah index is derived output and must not be edited as canonical source data. Re-import from reviewed source exports instead.

### Identity and validation

- Surah and ayah identity is numeric and stable; use `surah:ayah` keys for ayah-level joins.
- Word-level resources use stable word positions in addition to Surah and ayah identity.
- Never join related resources by array order.
- Validate the complete corpus and sample rendered content after imports.
- Missing source glosses remain missing; do not reconstruct or infer them.
- Keep Arabic script, translations, transliteration, tafsir and glosses as separate resource types.

### Rights and attribution

Resource rights are tracked independently. Several selected QUL resources currently have an unknown rights status; the tafsir export's catalogue identity/rightsholder is not fully verified. The header assets contain an embedded credit and CC BY 4.0 notice, but that does not establish the rights of other resources. Audio is streamed from an external CDN and its rights status is also recorded as unknown.

Before public production distribution, review the source terms and obtain the required rights/permissions for every dataset and audio source. Do not interpret availability on QUL or a CDN as a redistribution licence.

## Application data flow

### Public reader

Public routes provide the Quran index, Surah reading, search and optional companion content. Public Quran content is loaded from `@muslim-ayat/quran-data`; it does not require a Supabase session.

The reader supports Arabic text, selected translation, transliteration, recitation and optional study content. Optional surfaces are feature-flagged independently. Disabling an optional surface must not disable the underlying Quran text or prevent guest reading.

### Authentication

Supabase Auth is the identity provider. The application supports these methods when enabled:
- OAuth: Google, Microsoft (Supabase provider ID `azure`) and Facebook.
- Email/password: sign-up, password sign-in and password recovery.
- Email OTP: request a one-time email code and verify it.
- Magic link: request a sign-in link delivered by email.

Supabase owns credential storage, password hashing, email delivery and token verification. The application must never store passwords or OTPs. Provider secrets and SMTP configuration belong in Supabase/provider settings, not in browser variables or source control.

The OAuth and email confirmation callback is `/auth/callback`. Redirect URLs must be allowlisted in Supabase Auth. Configure the email template to expose the one-time token for OTP and the confirmation URL for magic-link delivery (or use separate templates if the project configuration supports them). Password recovery uses the recovery callback and a dedicated password-update screen. Configure and test these flows in the Supabase project before enabling them in production.

Account identities are not automatically merged based only on matching email addresses. Users should continue signing in with the same provider/identity unless a deliberate, verified account-linking flow is implemented.

### Personal data

Personal data currently includes:
- Profile language and reader preferences.
- Bookmarks.
- Notes.
- Reading progress.

Supabase stores synchronized account data. User-owned rows include an owner identifier and RLS policies compare it with `auth.uid()`. Server actions additionally authenticate the current user and validate input before database writes. RPC functions implement the local-first synchronization protocol.

Never expose a Supabase service-role key to browser code. Use only the publishable key in browser/server SSR clients; RLS remains the database authorization boundary.

## Offline and synchronization

The PWA service worker caches the public application shell and selected public reader routes/assets. It must not cache authenticated account responses, private study API responses or external audio streams.

IndexedDB stores accessed public Surah content and owner-partitioned personal records with a durable outbox. Synchronization is performed only for the currently authenticated owner. Operation identifiers make retries idempotent; timestamps and stable operation IDs provide deterministic conflict ordering. Tombstones represent deletions so that offline deletes can propagate.

Account switching must never expose one user's local records to another. Guest device preferences are local-only unless the user explicitly signs in and requests synchronization. Offline reading must continue to work independently of Supabase availability.

## Feature flags

Optional capabilities are controlled centrally by `apps/web/src/lib/features.ts`. Public flags use the `NEXT_PUBLIC_FEATURE_*` environment variables so server-rendered and client-rendered surfaces agree. A missing flag uses its documented default; the exact string `false` disables a flag.

Flags cover content capabilities (translation, transliteration, tafsir, word-by-word, search, audio and offline support), reader presentation (Mushaf layout and Surah headers), personal capabilities (bookmarks, notes, reading progress, reader preferences and account profile) and each authentication method/provider.

Feature flags are deployment configuration, not per-user preferences and not a security system. Every disabled capability must be hidden in navigation/UI and rejected or omitted at the corresponding server route/action. Database RLS remains mandatory regardless of flags. The core Quran reader and Arabic Quran text are deliberately not switchable off because they are the product's primary access guarantee.

To change flags, update the relevant environment variables in local `.env.local` or the deployment environment and rebuild/redeploy the application. Do not expose an unauthenticated public admin endpoint for changing global flags. A future remotely managed feature-flag service would require authenticated administrative authorization, audit history, safe defaults and server-side enforcement.

## Security and privacy

- Validate untrusted form and API input with Zod or equivalent boundary validation.
- Authenticate server actions before personal-data operations.
- Enforce row ownership with RLS for every user-owned table and RPC.
- Do not trust client-provided owner IDs; derive the owner from the verified Supabase session.
- Do not log passwords, OTPs, access tokens, refresh tokens or private note content.
- Use HTTPS in production and allowlist exact callback origins.
- Keep public caches strictly separate from private responses.
- Keep secrets out of Git and all `NEXT_PUBLIC_*` variables.

## Quality gates

The CI workflow runs dependency installation, type checking, linting, unit tests, Playwright browser tests, production build, Supabase migration linting and pgTAP RLS tests. Deployment to Cloudflare Workers is gated on the check and RLS jobs.

Changes to feature flags should include tests for defaults, explicit disablement and server-side enforcement. Authentication changes should include tests for method/provider allowlisting, invalid input, callback handling and guest access to public Quran routes.

## Operational configuration

Required web environment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Optional capability flags are documented in `.env.example`. OAuth client credentials and email delivery settings are configured in Supabase Auth and the respective provider/SMTP consoles. Cloudflare deployment requires a scoped API token and account ID in GitHub Actions secrets.

## Future considerations

- Rights-cleared translations, tafsir, fonts, Mushaf layouts and recitations.
- More advanced search and word-level audio synchronization.
- Administrative remote feature-flag management with auditability.
- Additional web/native clients reusing the content and shared-schema packages.
- Account linking only after a secure identity-verification design.
