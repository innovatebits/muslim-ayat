import {
  QuranContentSourcesSchema,
  type QuranContentSource,
} from "./reader";

const requiredResourceKinds: QuranContentSource["kind"][] = [
  "arabic",
  "translation",
  "transliteration",
  "tafsir",
  "word-by-word-translation",
  "surah-metadata",
  "surah-header",
  "audio",
];

const permissionLabels = {
  publicDisplay: "Public display",
  redistribution: "Redistribution",
  offlineCaching: "Offline caching",
  commercialUse: "Commercial use",
} as const;

function displayValue(value: string | null | undefined) {
  if (value === null || value === undefined || value.length === 0) return "Not recorded";
  return value;
}

function getUnresolvedItems(source: QuranContentSource): string[] {
  const unresolved = [];
  if (source.rightsReview.reviewStatus === "unreviewed") {
    unresolved.push("Rights review is not complete");
  }
  if (source.rightsReview.rightsHolder === null) unresolved.push("Rights holder is unknown");
  if (source.rightsReview.evidence.length === 0) unresolved.push("No rights evidence is recorded");
  if (source.rightsReview.attribution.status === "unknown") {
    unresolved.push("Attribution requirement is unknown");
  }
  for (const [key, label] of Object.entries(permissionLabels)) {
    if (source.rightsReview.permissions[key as keyof typeof permissionLabels] === "unknown") {
      unresolved.push(`${label} permission is unknown`);
    }
  }
  return unresolved;
}

function getResourceReviewState(source: QuranContentSource) {
  if (getUnresolvedItems(source).length > 0) return "UNRESOLVED";
  if (Object.values(source.rightsReview.permissions).includes("not-permitted")) {
    return "RESTRICTIONS RECORDED — HUMAN SIGNOFF REQUIRED";
  }
  return "REVIEWED — PERMISSIONS RECORDED; HUMAN SIGNOFF REQUIRED";
}

function renderEvidence(source: QuranContentSource) {
  if (source.rightsReview.evidence.length === 0) return "Not recorded";
  return source.rightsReview.evidence
    .map((evidence) => {
      const label = `${evidence.label} (${evidence.kind})`;
      return evidence.url
        ? `[${label}](${evidence.url})`
        : `${label} — reference: ${evidence.reference}`;
    })
    .join("; ");
}

export function buildContentRightsReport(input: unknown): string {
  const sources = QuranContentSourcesSchema.parse(input);
  const presentKinds = new Set(sources.map((source) => source.kind));
  const missingKinds = requiredResourceKinds.filter((kind) => !presentKinds.has(kind));
  if (missingKinds.length > 0) {
    throw new Error(`Rights report is missing resource categories: ${missingKinds.join(", ")}`);
  }

  const orderedSources = [...sources].sort((left, right) =>
    left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
  );
  const unresolvedResources = orderedSources.filter((source) => getUnresolvedItems(source).length > 0);
  const unresolvedPermissions = orderedSources.reduce(
    (total, source) =>
      total + Object.values(source.rightsReview.permissions).filter((value) => value === "unknown").length,
    0,
  );
  const restrictedPermissions = orderedSources.reduce(
    (total, source) =>
      total +
      Object.values(source.rightsReview.permissions).filter((value) => value === "not-permitted").length,
    0,
  );
  const missingEvidence = orderedSources.filter((source) => source.rightsReview.evidence.length === 0).length;
  const kindCounts = requiredResourceKinds
    .map((kind) => `${kind}: ${orderedSources.filter((source) => source.kind === kind).length}`)
    .join("; ");

  const lines = [
    "# Quran content rights review report",
    "",
    `- Resource records: ${orderedSources.length}`,
    `- Resource categories: ${kindCounts}`,
    `- Resources with unresolved review details: ${unresolvedResources.length}`,
    `- Unresolved use permissions: ${unresolvedPermissions}`,
    `- Restricted use permissions: ${restrictedPermissions}`,
    `- Resources without rights evidence: ${missingEvidence}`,
    "- Release decision: NOT DETERMINED — human release signoff is required.",
    "",
    "> This report inventories recorded metadata; it is not legal or scholarly advice and does not grant rights or release clearance. Verify the exact resource and intended use with the rightsholder/legal reviewer and qualified scholarly reviewer. Unknown permissions are not permission.",
    "",
    "## Unresolved resources",
    "",
    ...(unresolvedResources.length > 0
      ? unresolvedResources.map((source) => {
          const unresolved = getUnresolvedItems(source);
          return `- \`${source.id}\` — ${source.name}: ${unresolved.join("; ")}.`;
        })
      : ["- None recorded; human release signoff is still required."]),
    "",
    "## Resource details",
    "",
  ];

  for (const source of orderedSources) {
    const review = source.rightsReview;
    const reviewState = review.reviewStatus === "reviewed" ? "Reviewed" : "Unreviewed";
    const attribution =
      review.attribution.status === "required"
        ? `Required — ${review.attribution.text}`
        : review.attribution.status === "not-required"
          ? "Recorded as not required"
          : "Unknown";

    lines.push(
      `### ${source.name} (\`${source.id}\`)`,
      "",
      `- Category: ${source.kind}`,
      `- Source: ${source.source}`,
      `- Edition: ${source.edition}`,
      `- Source record: ${source.url}`,
      `- License metadata: ${displayValue(source.license)}`,
      `- Rights review: ${reviewState}`,
      `- Rights holder: ${displayValue(review.rightsHolder)}`,
      `- Attribution: ${attribution}`,
      `- Reviewer role: ${displayValue(review.reviewerRole)}`,
      `- Review date: ${displayValue(review.reviewedAt)}`,
      `- Rights evidence: ${renderEvidence(source)}`,
      "- Permissions:",
      ...Object.entries(permissionLabels).map(
        ([key, label]) =>
          `  - ${label}: ${review.permissions[key as keyof typeof permissionLabels]}`,
      ),
      `- Resource review state: ${getResourceReviewState(source)}`,
      "",
    );
  }

  return `${lines.join("\n")}\n`;
}