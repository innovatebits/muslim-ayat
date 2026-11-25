# Muslim Ayat

Read, listen, understand and learn the Quran.

Muslim Ayat is a PWA-first Bun workspace for a Quran platform. Quran content is versioned independently from user accounts and hosting; personal data belongs in Supabase, and the web app is deployed to Cloudflare Workers with OpenNext.

> **Content rights:** The selected Quran, translation, transliteration, Surah metadata, tafsir, word-by-word glosses, and header resources are attributed to their sources and checksummed. QUL’s resource pages report copyright information unavailable for the selected resources; rights are therefore recorded as **unknown**, not as public domain or a licence. The repo does not claim redistribution clearance; production operators must complete appropriate rights review.

## Project documentation

- [Architecture](docs/architecture.md)
- [Product scope](docs/product-scope.md)
- [Architecture decisions](docs/decisions/README.md)

## Architecture

- `apps/web` — Next.js App Router, TypeScript, Tailwind CSS, PWA manifest/service worker, and Supabase browser/server client factories.
- `packages/quran-data` — versioned Quran text, translations, transliteration, Surah metadata, study content, audio references, provenance, and validation; no Supabase or Cloudflare dependency.
- `packages/shared` — shared validation schemas and types.
- `packages/database` — Supabase database types.
- `packages/ui` — reusable UI primitives.
- `supabase/migrations` — SQL schema and Row Level Security policies for user-owned data.
- `scripts` — content import, corpus validation, derived-index, and PWA icon generation.

The service worker caches public shell assets and static `/quran` and `/surah/*` reader pages only. Account pages, authenticated responses, study API responses, and external audio streams are not written to its shared cache. Public Surah content and owner-partitioned bookmarks, notes, and progress are also stored in IndexedDB; authenticated edits sync through an idempotent outbox and owner-scoped Supabase policies.

### Guest access and personalization

Reading is public: Quran index and Surah routes, Arabic text, translations, search, recitation, and study content do not require a Supabase session. The PWA can cache public Quran content for offline reading. Account access is reserved for personal features and cross-device sync; server actions use `requireUser`, and Supabase RLS restricts profile preferences, bookmarks, notes, and reading progress to their owner. Signed-out reading preferences remain available on the current device; requesting cross-device preference sync or saving personal data presents a sign-in invitation without blocking Quran reading. Future web and native clients must follow this same public-content/personal-data boundary and use the shared `ReaderPreferencesSchema` for synced reader settings.

## Requirements

- Bun `1.4.5` (pinned in `package.json` and CI)
- Node.js `20.9` or newer for framework/deployment tooling
- Docker Desktop only for local Supabase services

## Local development

```powershell
bun install
bun run dev
```

The app runs at `http://localhost:3000`. Copy `.env.example` to `apps/web/.env.local`; add the Supabase project URL and publishable key to enable accounts and cloud sync. Set `NEXT_PUBLIC_APP_URL` to the exact deployed app origin. Set `NEXT_PUBLIC_ENABLE_AUDIO=false` to disable external recitation streaming or `NEXT_PUBLIC_ENABLE_OFFLINE=false` to disable service-worker registration. Never put a Supabase secret/service-role key in browser code or a `NEXT_PUBLIC_` variable.

Useful checks:

```powershell
bun run typecheck
bun run lint
bun run test
bun run test:e2e
bun run build
```

Playwright installs Chromium once with `bunx playwright install chromium`.

Playwright uses port 3100 and a separate `.next-playwright` output directory by default. Override with `PLAYWRIGHT_PORT` if that port is in use; set `PLAYWRIGHT_REUSE_SERVER=1` only when intentionally testing an already-running instance.

## Content provenance and import

Canonical Arabic is QUL “Uthmani Simple (Ayah by Ayah, Hafs, Me-Quran),” resource 82, stored verbatim in `packages/quran-data/src/data/quran.json`. Its resource-level copyright/licence information is unavailable; metadata records `rightsStatus: unknown`, and does not claim public-domain status or clearance. The QUL Surah names dataset is separate resource 70. Saheeh International simple translation and English Tajweed transliteration are separate QUL companion datasets; tafsir and English word-by-word glosses remain separate study resources, never canonical Arabic.

Source metadata and checksums are stored beside the datasets under `packages/quran-data/src/data/`. The word-by-word export contains three missing gloss positions (`2:181:4`, `8:6:5`, `13:37:9`); the reader leaves them blank rather than reconstructing text. The tafsir export's QUL resource ID and original rights holder could not be independently verified. The Surah header SVG files include an embedded credit and “CC BY 4.0” notice, but QUL’s resource-level rights remain unknown.

```powershell
bun run validate:quran-data
bun run generate:quran-index
bun run import:quran-data 'path\to\qul-uthmani-export.zip'
bun run import:quran-companions 'path\to\saheeh.zip' 'path\to\transliteration.zip'
bun run import:quran-metadata 'path\to\surah-names.zip'
bun run import:quran-surah-headers 'path\to\surah-name-header-svg.zip'
bun run import:quran-study 'path\to\abridged-explanation.zip' 'path\to\english-wbw-translation.zip'
```

Import scripts validate structure, preserve source files, and record SHA-256 checksums. The generated index is derived output; do not edit it as canonical content. Review each resource’s source and rights independently; permission for one QUL resource does not imply permission for another.

Before production, rerun `bun run validate:quran-data`, compare the recorded source hashes with the approved exports, confirm attribution and rights for each resource independently, and review rendered Arabic/translation/study content. Unknown rights do not imply permission to redistribute; never edit or generate replacement Quran text, and keep missing source glosses explicitly missing.

## Supabase

### Social sign-in setup

1. Create OAuth applications with [Google](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [Microsoft](https://supabase.com/docs/guides/auth/social-sign-in/auth-azure), and [Facebook](https://supabase.com/docs/guides/auth/social-sign-in/auth-facebook), then enable those providers in Supabase Dashboard → **Authentication → Sign In / Providers**. Supabase labels the Microsoft provider **Azure**; the web app uses its `azure` provider ID.
2. Copy the provider callback URL shown in each Supabase provider's settings into that provider application's allowed redirect/callback URLs. For local Supabase, use the local Auth callback URL shown for the local project.
3. In Supabase Dashboard → **Authentication → URL Configuration**, set the Site URL to the app origin and add the exact app callback URL (`https://<app-host>/auth/callback`) to the Redirect URLs allowlist. For local development, `http://localhost:3000/auth/callback` is already listed in `supabase/config.toml`.
4. Set `NEXT_PUBLIC_APP_URL` to the app origin in each deployment environment. The server action sends users back through `/auth/callback`, which exchanges the authorization code and persists the Supabase session using the SSR cookie client.

Store provider client IDs and secrets only in Supabase provider settings or local, untracked Supabase environment/configuration. Never commit OAuth credentials or expose client secrets in browser code or `NEXT_PUBLIC_` variables. Account access is optional: Quran reading and public content remain available signed out, while personal data requires a session and remains owner-scoped by RLS. Users should return with the same provider identity; this release does not link or merge accounts based only on matching email addresses. Canonical Quran text stays in the versioned data package, never in user-editable tables.

```powershell
bunx supabase start
bunx supabase status
bunx supabase db reset
bunx supabase test db
```

`supabase/tests/user-data-rls.test.sql` exercises signed-out and cross-user denial, owner CRUD, sync-owner checks, and stale-write conflict behavior. These pgTAP tests require Docker and a local Supabase stack. For a hosted project, link it and apply reviewed migrations with `bunx supabase db push`.

## Offline behavior and personal data

- Static reader routes and public assets can be cached for offline Quran reading. Authenticated account pages, study API payloads, and audio streams are not stored in the shared service-worker cache.
- IndexedDB stores accessed Surah content and user-owned bookmarks, notes, progress, and a durable outbox. Edits are written locally first and retried after reconnect.
- Signed-in changes sync only when the active Supabase user matches the local owner. Legacy guest-only edits from earlier versions stay isolated on that device and are not automatically transferred when someone signs in.
- New bookmarks, notes, and reading-progress saves require sign-in.
- Bookmarks and notes use tombstones; notes and reading progress resolve conflicts by `client_updated_at`, then a stable operation UUID. Database RPCs apply that ordering atomically, and RLS remains the access boundary.
- Audio is streamed on demand from AlQuran Cloud and is unavailable offline; no audio files are bundled or automatically downloaded.

## Audio and study resources

`NEXT_PUBLIC_ENABLE_AUDIO=false` disables the recitation player. When enabled, it streams per-ayah MP3s from the AlQuran Cloud CDN and offers reciter selection, repeat, playback speed, and ayah navigation. The CDN documents delivery endpoints but does not establish redistribution rights for audio; resource rights are displayed as unknown.

The app also exposes a QUL tafsir export and QUL English Word-by-Word resource #92 as separate study content. The tafsir export’s exact QUL catalogue ID and original rights holder are unverified; both resources have unknown rights status. The three absent word glosses remain blank. Study content is commentary/gloss material and is never substituted for canonical Quran text.

## Cloudflare Workers

The app uses the requested OpenNext adapter and a Worker config at `apps/web/wrangler.jsonc`; it is not a static Pages export. Preview and deploy from the repository root:

```powershell
bun run cf:build
bun run cf:preview
bun run cf:deploy
```

Authenticate Wrangler first with `bunx wrangler login`. GitHub deployment runs only after checks pass on `main` and requires `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_APP_URL`. Set the public flags `NEXT_PUBLIC_ENABLE_AUDIO` and `NEXT_PUBLIC_ENABLE_OFFLINE` deliberately for production. Configure a narrowly scoped Cloudflare API token, Supabase production values, and the auth callback URL in provider settings.

## Free-tier ceilings

Current published limits are useful planning figures, not a promise of free production availability:

- [Supabase Free](https://supabase.com/pricing): 500 MB database, 1 GB file storage, 5 GB egress plus 5 GB cached egress, 50,000 monthly active users, and projects may pause after one week of inactivity. Automatic backups are not included.
- [Cloudflare Workers Free](https://developers.cloudflare.com/workers/platform/limits/): 100,000 requests per day, 10 ms CPU per request, and 50 subrequests per request.

Plans and limits can change. Monitor usage, verify current provider terms before launch, and do not promise unlimited or uninterrupted free service.

## Scope and next steps

The web reader, search/preferences, sign-in/account flows, owner-scoped personal records, local-first offline queue, external recitation player, tafsir, and word-by-word study panel are implemented. Rights remain unknown for the selected QUL resources and CDN audio; production release requires an appropriate rights review. Additional reciters, translations, study resources, and optional offline audio are future work. Future Expo clients can reuse the Quran-data and shared packages without coupling them to web hosting.
