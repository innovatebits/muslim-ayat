# Muslim Ayat

**Read, listen, understand and learn the Quran.**

Muslim Ayat is an offline-capable Quran web app built with Next.js. Quran content is versioned independently from accounts; Supabase stores authentication and user-owned data; Cloudflare Workers hosts the web application.

## Project status

The repository contains the public Quran reader, QUL-based content pipeline, search, recitation player, study resources, PWA/offline support, Supabase authentication and personal-data synchronization.

> **Content rights:** Rights are tracked per resource. Some selected QUL datasets and the external audio source currently have an unknown rights status. Availability from a catalogue or CDN is not a redistribution licence. Complete a rights review before production distribution.

## Stack

- Bun workspaces and Turborepo
- Next.js App Router, React, TypeScript and Tailwind CSS
- Supabase Auth and PostgreSQL with RLS
- IndexedDB and service worker for offline support
- Cloudflare Workers with OpenNext
- Vitest, Playwright and Supabase pgTAP

## Local development

Requirements: Bun 1.4.5, Node.js 20.9+, and Docker Desktop for local Supabase.

```bash
bun install
cp .env.example apps/web/.env.local
bun run dev
```

Set the Supabase URL and publishable key in `apps/web/.env.local`. The app is available at `http://localhost:3000`.

## Quality checks

```bash
bun run typecheck
bun run lint
bun run test
bun run test:e2e
bun run build
bun run validate:quran-data
```

Run database tests locally with:

```bash
bunx supabase start
bunx supabase db reset
bunx supabase test db
```

## Authentication

Supabase Auth supports configurable Google, Microsoft, Facebook, email/password, email OTP and magic-link sign-in. Configure OAuth credentials, email templates, SMTP delivery and redirect URLs in Supabase; see [Supabase Auth documentation](https://supabase.com/docs/guides/auth).

## Feature configuration

Optional capabilities are controlled by `NEXT_PUBLIC_FEATURE_*` flags in the deployment environment. See [`.env.example`](.env.example) for the complete list and defaults. Set a flag to `false` to disable that capability, then rebuild/redeploy. The core Quran reader and Arabic text remain available.

Flags control product availability, not authorization. Server actions and API routes must enforce disabled features, and Supabase RLS continues to protect user data.

## Content maintenance

QUL resources are imported as versioned source data; QUL is not a runtime API dependency. Use the repository import scripts and validation command rather than editing generated indexes or canonical Quran text manually. Review each resource's attribution and licence independently before distribution.

See [Architecture](docs/architecture.md), [Product scope](docs/product-scope.md) and [Architecture decisions](docs/decisions/README.md) for implementation details and design constraints.
