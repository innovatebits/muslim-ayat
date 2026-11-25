# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Muslim readers across familiarity levels, for a global audience. The product is intended to support reading, listening, understanding, and learning the Quran; no single experience level is prioritized.

## Product Purpose

Muslim Ayat is a Quran platform intended to make reading, listening, understanding, and learning the Quran reliable and available offline. The guiding principle is to build a reliable, beautiful, offline-capable Quran platform first.

## Positioning

Open: the user marked a proposed summary of the product promise as incomplete but did not provide replacement wording. Confirmed commitments include independently managed Quran content, hosting-independent business logic, and adding paid infrastructure only when actual usage makes it necessary; whether these fully express the intended distinction remains to be confirmed.

## Operating Context

The first platform is an installable PWA for desktop and mobile browsers, with offline use as a goal. The intended jobs are reading, listening, understanding, and learning the Quran; specific moments, routines, and offline usage contexts have not been established.

## Capabilities and Constraints

- The current web/PWA includes public Quran reading, search, audio and study routes, plus authenticated account features and offline support. Reading remains available without signing in.
- Quran text must remain independent of accounts and hosting. Keep canonical content versioned in the content package, not in user-editable tables.
- Do not publish Quran text until its source, edition, licence, and integrity checksum have been reviewed. The expected corpus is 114 surahs and 6,236 ayahs. Never substitute AI-generated or placeholder scripture for verified text.
- The service worker may cache public assets and approved Quran content, but must not cache private authenticated responses in a shared public cache.
- Supabase is intended for authentication and personal data such as bookmarks, notes, profiles, and reading progress. Keep secret/service-role credentials out of browser code and public environment variables.
- Quran reading, browsing, search, listening, and public study content must never require authentication; sign-in is reserved for personal data and cross-device sync. Guest device-only reader settings remain usable, while personal saves and preference sync require an authenticated user and owner-scoped RLS. Future web, PWA, Android, and iOS clients must preserve this same access boundary.
- The current stack is a Bun workspace with a Next.js and TypeScript web app, Supabase backend, and Cloudflare Workers hosting through OpenNext. Keep application logic independent of the hosting provider.
- Additional translations, reciters, personalized learning plans, and personal reading history remain follow-up work. When introduced, personal history and learning plans must require an authenticated user and owner-scoped RLS; do not imply these features are available until implemented and reviewed. Attribute licensed content correctly.
- The initial infrastructure budget target is ₹0. Treat free tiers as constrained launch infrastructure, and add paid services only when actual usage requires them.

## Brand Commitments

The product name is Muslim Ayat. Its stated promise is “Read · Listen · Understand · Learn the Quran.” The intended audience is global. No additional binding voice, logo, or brand-asset requirements have been established.

## Evidence on Hand

The repository contains the product architecture and scope in `README.md`, Quran datasets and source metadata in `packages/quran-data`, the guest-first landing page in `apps/web/src/app/page.tsx`, and the reader's source-integrity notice in `apps/web/src/app/quran/page.tsx`. Do not fabricate testimonials, usage metrics, or claims that resources with unknown rights are cleared for redistribution.

## Product Principles

- Protect Quran integrity: verified source and provenance precede publication; do not generate or approximate scripture.
- Keep canonical content independent from user accounts and infrastructure providers.
- Make dependable offline access a foundational product goal while protecting private user data.
- Start with cost-conscious infrastructure and scale spending in response to demonstrated usage.
- Be explicit about what is implemented versus planned; do not present roadmap features as available.