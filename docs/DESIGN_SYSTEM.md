# Muslim Ayat Design System

**Status:** Initial design foundation and implementation guidance.
**Scope:** Web/PWA experience in `apps/web`; this is not a new component library.
**Product promise:** Read · Listen · Understand · Learn the Quran.

## Design intent

Muslim Ayat should feel like a calm, trustworthy, focused Quran reading space. The interface should make the Quran and the reader's current task the visual priority—not dashboards, promotional cards, gamification, or account conversion.

Design for a global audience across desktop and mobile, different levels of Quran familiarity, long reading sessions, keyboard and assistive-technology use, and low-connectivity environments.

### Principles

1. **Reader first.** Minimize competing navigation, decoration, and repeated calls to action.
2. **Quiet confidence.** Use restrained color, clear hierarchy, generous whitespace, and consistent surfaces.
3. **Respect the text.** Arabic Quran content receives appropriate typography, direction, spacing, and visual prominence. Never clip, reshape, or alter canonical text to fit a design.
4. **Clarity over ornament.** Icons and decorative elements must not obscure meaning or replace accessible labels.
5. **Guest-first.** Public reading controls are primary. Sign-in prompts appear only when a guest initiates an account-only save or sync action.
6. **Honest content.** Attribution, edition, and rights status remain discoverable without overwhelming the reading surface.
7. **Accessible by default.** Keyboard, screen reader, contrast, zoom, reduced motion, and touch targets are design requirements, not final polish.

## Existing foundation

The app currently uses Tailwind CSS 4 and a small CSS-variable foundation in `apps/web/src/app/globals.css`. The current palette is light-only and uses these legacy variables:

- `--page`: `#f7f6ef`
- `--ink`: `#1d2c26`
- `--muted`: `#65756d`
- `--green`: `#123d32`
- `--line`: `#e5e6dc`

Treat these as the starting palette, not a fully specified system. Migrate page styles to semantic tokens incrementally; avoid a disruptive all-at-once rewrite.

## Semantic design tokens

Use semantic names so components do not hard-code palette values. Initial light values below retain the current visual direction; validate them against actual text sizes and states before calling them accessible.

| Token | Purpose | Initial light value |
|---|---|---|
| `--color-page` | Main app canvas | `#f7f6ef` |
| `--color-surface` | Cards, menus, reader controls | `#ffffff` |
| `--color-surface-muted` | Quiet panels and grouped areas | `#edf0e7` |
| `--color-text` | Primary text | `#1d2c26` |
| `--color-text-muted` | Supporting text | `#52665c` |
| `--color-brand` | Primary brand/action | `#123d32` |
| `--color-brand-hover` | Hover/active brand state | Validate a darker/lighter accessible value |
| `--color-border` | Dividers and control outlines | `#dfe5da` |
| `--color-focus` | Visible keyboard focus | `#356b55` |
| `--color-selection` | Selected text background | `#d3e2d7` |
| `--color-danger` | Errors/destructive actions | Select and contrast-test before use |
| `--color-success` | Confirmed/success states | Select and contrast-test before use |

Legacy variables may temporarily alias the semantic tokens to avoid breaking existing screens. Do not use color alone to communicate status.

### Theme behavior

- Light is the default and must remain fully supported.
- Add dark mode only as a complete semantic token set; do not invert colors mechanically.
- Consider sepia only after reader testing demonstrates a distinct benefit.
- Theme choice is a device-level reader preference when signed out. If the user signs in, optional sync follows the existing authenticated preference-sync contract.
- Verify theme before expanding the number of themes; a small, legible set is better than many inconsistent palettes.

## Typography

- **Interface text:** use a modern, readable system sans-serif stack. Avoid decorative display fonts for navigation, controls, metadata, or long-form explanations.
- **Arabic Quran text:** retain the dedicated Arabic font stack and ensure the actual font files are available/licensed before relying on a specific face. The current CSS references Noto Naskh Arabic, Amiri, and Times New Roman as fallbacks.
- **Arabic layout:** use `lang="ar"` and `dir="rtl"` on the correct content container. Do not set the entire page RTL.
- **Reading rhythm:** prioritize comfortable line-height, clear ayah separation, enough horizontal room for Arabic, and predictable translation placement.
- **Scale:** use a consistent type scale for page title, section heading, body, supporting text, and metadata. Avoid oversized headings on utility screens.
- **Content integrity:** font/rendering changes must not omit marks, ligatures, or glyphs. Verify representative Arabic passages on supported desktop and mobile browsers.

## Layout and spacing

Use a consistent spacing scale based on 4px increments. Prefer a small number of reusable content widths:

- **Reading column:** optimized for Arabic line length and translation pairing; centered and not stretched edge-to-edge on desktop.
- **Utility content:** narrower than the full viewport for search, account, and settings forms.
- **Wide index/list:** may use more horizontal room but should preserve readable row density.
- **Mobile:** prioritize the reading content and essential actions; move secondary settings into a clearly labelled sheet or section rather than compressing controls.

Use consistent page gutters, vertical section spacing, card padding, border radii, and control heights. Avoid excessive nested cards, large empty hero areas, and decorative gradients that compete with content.

## Components and interaction patterns

Build on existing app-local components and `packages/ui`. Promote a component into the shared package only when multiple screens genuinely need the same stable behavior.

| Pattern | Guidance |
|---|---|
| App header/navigation | Clear brand/home link, a small number of primary destinations, obvious active state, keyboard skip link where appropriate. |
| Primary action | One clear primary action per region; reserve filled brand treatment for the main action. |
| Secondary action | Quiet outlined or text action; do not style every link as a button. |
| Surah list | Easy scanning by number/name/ayah count; large touch-friendly row target; avoid overdecorated tiles. |
| Ayah block | Arabic text is visually primary; translation/transliteration are clearly secondary; controls are discoverable but visually quiet. |
| Reader toolbar | Keep current location and essential actions visible; group secondary settings. |
| Audio controls | Clear play/pause, current ayah, reciter, progress, and errors; don't imply download/offline availability unless supported and rights-cleared. |
| Study content | Clearly label tafsir and word-by-word content as companion material, separate from Quran text, with source attribution and missing-data behavior preserved. |
| Personal save action | Explain sign-in only at the point a guest attempts to save/sync; preserve the current reading location through auth flow. |
| Forms | Explicit labels, concise help/error text, visible focus, sensible autocomplete and keyboard behavior. |
| Empty/error states | Explain what happened and what the user can do; do not fabricate content or show misleading success. |

## Responsive behavior

- Start with the narrow-screen reading flow, then enhance for larger viewports.
- Avoid horizontal scrolling for core navigation and reader controls.
- Keep Arabic text legible at common mobile widths and support browser zoom.
- Respect device safe areas for fixed/mobile controls.
- Use touch targets of at least 44 by 44 CSS pixels where practical.
- Ensure sticky/fixed controls do not obscure ayahs, headings, or focused elements.

## Accessibility requirements

- Semantic landmarks and ordered heading levels.
- Accessible names for icon-only buttons; decorative icons hidden from assistive technology.
- Full keyboard operation and a clearly visible focus indicator.
- Contrast target WCAG 2.2 AA for text and interactive UI (including focus and hover states).
- Do not rely on color alone for selected, disabled, error, or success state.
- Support text zoom/reflow and avoid fixed-height text containers.
- Respect `prefers-reduced-motion`.
- Keep focus visible and not hidden behind sticky elements or dialogs.
- Test Arabic screen-reader reading order and bidirectional mixed Arabic/English content.

## Content and trust presentation

- Keep provenance and rights details available at the relevant content surface (for example a source disclosure), not buried only in a generic legal page.
- Distinguish Quran text from translation, transliteration, tafsir, and glosses through labels and hierarchy.
- Unknown rights status must never be styled or worded as “licensed”, “verified”, or “approved”.
- Never use generated scripture, placeholder ayahs, fabricated testimonials, unsupported user metrics, or claims of complete offline/audio support.
- Do not use imagery or decorative motifs that imply a religious authority or scholarly endorsement the product does not have.

## Page-level application order

1. **Quran reader:** Arabic typography, line rhythm, ayah actions, reader toolbar, audio/study separation, mobile layout.
2. **Quran index:** scan-friendly surah list, useful navigation and clear entry into reading.
3. **Search:** query focus, accessible filters/results, verse context and predictable result hierarchy.
4. **Settings:** compact, grouped preferences with clear device-local vs account-synced behavior.
5. **Homepage:** concise product promise and immediate “Read the Quran” entry point; no sign-in conversion hero or unnecessary feature-card grid.
6. **Account/auth:** clear explanation that accounts save personal data; do not imply an account is needed to access Quran content.

## Definition of done for a visual change

- Uses semantic tokens rather than introducing unrelated one-off colors.
- Works at mobile, tablet, and desktop widths.
- Preserves guest access and the current personal-data boundary.
- Arabic content is not clipped, reordered incorrectly, or modified.
- Keyboard and screen-reader behavior remains correct.
- Contrast, focus, zoom/reflow, and reduced motion are checked.
- No new dependency is introduced without a written reason.
- Relevant unit/E2E tests pass; screenshots are reviewed at narrow and wide breakpoints.
- Any unsupported feature/rights claim is absent.
