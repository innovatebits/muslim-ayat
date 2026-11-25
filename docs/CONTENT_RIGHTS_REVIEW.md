# Quran Content Rights Review and Release Signoff

## Purpose and limits

Muslim Ayat records evidence-backed rights decisions in `packages/quran-data` and exposes them through the source disclosures and a repeatable report. The report is an inventory of metadata, not legal advice, scholarly validation, permission, or release approval. Source availability, source listings, attribution text in a file, and checksum matches do not establish redistribution or other rights.

Legal/rightsholder review and qualified scholarly review are external prerequisites. No review or rights clearance is asserted by this implementation. All resource decisions remain `unknown` until appropriate evidence and reviews are recorded.

## Generate the report

From the repository root, run:

```powershell
bun run report:content-rights
```

The command prints a deterministic Markdown report to standard output. Save or attach that exact output to the release review record alongside the commit being reviewed. Valid `unknown` records are included and do not make the command fail. Malformed metadata, duplicate resource IDs, or a missing resource category make the report command exit unsuccessfully. This command is report-only and is not a CI or deployment blocker.

The inventory comes from `getContentSources()` in `packages/quran-data/src/reader.ts`, including audio provider terms and each reciter’s recording/performance rights as separate resources. Quran-data schema parsing validates source records before report generation.

## Evidence and metadata requirements

Review each exact source and edition independently. Use evidence from the rightsholder, publisher, authoritative license or terms, or another documented source that addresses the resource itself and the intended use. Keep the evidence URL or a stable reference in `rightsReview.evidence`; do not infer a grant from a dataset catalogue, downloaded archive, public CDN, or checksum.

Record these fields on the relevant resource in Quran-data metadata:

- `reviewStatus`: keep `unreviewed` until a qualified review is complete. A `reviewed` record requires evidence, reviewer role, and a distinct `reviewedAt` date.
- `rightsHolder` and the existing source `edition`: identify the rightsholder and exact material reviewed. Re-review when the source or edition changes; importers preserve decisions only while those identifiers match.
- `evidence`: record relevant license/terms, rightsholder, attribution, or scholarly references. Do not copy source material into this field.
- `attribution`: record whether attribution is required and the exact required text when known. Preserve `unknown` until verified.
- `permissions`: decide independently for `publicDisplay`, `redistribution`, `offlineCaching`, and `commercialUse`. Values are `permitted`, `not-permitted`, or `unknown`. A reviewed restriction is not a grant. Unreviewed resources cannot carry use-permission decisions.
- `reviewerRole` and `reviewedAt`: record the qualified role and an ISO-8601 review date. Keep this date separate from source `verifiedAt`, which records technical source/checksum metadata.

For recitations, review provider/stream terms separately from the rights in each reciter’s recording and performance. A provider’s permission to stream a file does not establish recording/performance permission, and vice versa. Apply the same resource-specific care to the Arabic corpus, translation, transliteration, tafsir, glosses, Surah metadata, and header artwork. Quran text, translations, transliteration, tafsir, and glosses also need qualified scholarly review appropriate to their content; technical schema validation is not scholarly review.

## Manual release signoff procedure

For every release that includes Quran resources:

1. Generate the report from the exact candidate commit and attach it to the release PR or release ticket.
2. Compare the report’s resource inventory and exact editions against what the release actually displays, redistributes, caches offline, or otherwise uses. Investigate any missing or newly changed resource before signoff.
3. Have legal/rightsholder reviewers verify the evidence, rights holder, attribution language, and each relevant permission. Have qualified scholarly reviewers verify the applicable Quranic, translation, transliteration, tafsir, gloss, or metadata content.
4. Do not record `permitted` without evidence that covers that specific use. Keep unresolved permissions `unknown`; record restrictions as `not-permitted` rather than treating a completed review as clearance.
5. Decide whether the candidate release is acceptable for its actual uses. Any unresolved permission or applicable restriction requires an explicit human decision; this report cannot determine that decision. Do not approve release use that lacks required permission or attribution.
6. Record the human release decision, reviewers, date, and reviewed report/commit in the release PR or ticket. This is the signoff record, not a second independently maintained rights register; Quran-data metadata remains the source of truth for resource decisions.

There is deliberately no CI rights-status or deployment blocker. A successful report command means only that the metadata is structurally valid and the inventory can be reported; it does not mean the resources are cleared or the release is ready. Public reading, search, study, and listening availability is not automatically changed by this report.

## Current review status

The source records introduced with this implementation use explicit `unreviewed` state, unknown attribution/rights holder where unverified, and `unknown` for every permission. No legal/rightsholder or scholarly review has been performed by the implementation or test process. Human evidence review and release signoff remain pending.