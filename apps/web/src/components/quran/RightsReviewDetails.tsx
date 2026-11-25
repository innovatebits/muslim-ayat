import type { QuranRightsReview } from "@muslim-ayat/quran-data";

type RightsReviewDetailsProps = {
  label: string;
  rightsReview: QuranRightsReview;
};

const permissionLabels = {
  publicDisplay: "Public display",
  redistribution: "Redistribution",
  offlineCaching: "Offline caching",
  commercialUse: "Commercial use",
} as const;

function getPermissionLabel(permission: "unknown" | "permitted" | "not-permitted") {
  if (permission === "permitted") return "Permitted";
  if (permission === "not-permitted") return "Not permitted";
  return "Unknown";
}

export function RightsReviewDetails({ label, rightsReview }: RightsReviewDetailsProps) {
  const statusLabel =
    rightsReview.reviewStatus === "reviewed"
      ? "Reviewed; permissions are use-specific"
      : "Unreviewed; permissions unresolved";

  return (
    <details className="mt-3 rounded-lg border border-[var(--line)] p-3 text-xs leading-5 text-[var(--muted)]">
      <summary className="cursor-pointer font-medium text-[var(--green)]">
        Rights review for {label}: {statusLabel}
      </summary>
      <div className="mt-3 space-y-3">
        <p>
          {rightsReview.reviewStatus === "reviewed"
            ? "A recorded review is not blanket permission; check each use below."
            : "No permission is inferred from availability, a source listing, or technical checksums."}
        </p>
        <dl className="grid gap-x-3 gap-y-1 sm:grid-cols-[max-content_1fr]">
          <dt className="font-medium text-[var(--ink)]">Rights holder</dt>
          <dd>{rightsReview.rightsHolder ?? "Unknown"}</dd>
          <dt className="font-medium text-[var(--ink)]">Attribution</dt>
          <dd>
            {rightsReview.attribution.status === "required"
              ? `Required: ${rightsReview.attribution.text}`
              : rightsReview.attribution.status === "not-required"
                ? "Recorded as not required"
                : "Unknown"}
          </dd>
          {rightsReview.reviewStatus === "reviewed" ? (
            <>
              <dt className="font-medium text-[var(--ink)]">Reviewer role</dt>
              <dd>{rightsReview.reviewerRole}</dd>
              <dt className="font-medium text-[var(--ink)]">Review date</dt>
              <dd>
                <time dateTime={rightsReview.reviewedAt ?? undefined}>
                  {rightsReview.reviewedAt ?? "Not recorded"}
                </time>
              </dd>
            </>
          ) : null}
        </dl>
        <ul aria-label={`${label} permissions by use`} className="space-y-1">
          {Object.entries(permissionLabels).map(([key, permissionLabel]) => (
            <li key={key}>
              {permissionLabel}: {getPermissionLabel(rightsReview.permissions[key as keyof typeof permissionLabels])}
            </li>
          ))}
        </ul>
        <div>
          <h4 className="font-medium text-[var(--ink)]">Rights evidence</h4>
          {rightsReview.evidence.length > 0 ? (
            <ul className="list-inside list-disc">
              {rightsReview.evidence.map((evidence, index) => (
                <li key={`${evidence.kind}-${evidence.label}-${index}`}>
                  {evidence.url ? (
                    <a
                      className="font-medium text-[var(--green)] underline underline-offset-2"
                      href={evidence.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {evidence.label} ({evidence.kind})
                    </a>
                  ) : (
                    `${evidence.label} (${evidence.kind}; ${evidence.reference})`
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No rights evidence recorded.</p>
          )}
        </div>
      </div>
    </details>
  );
}