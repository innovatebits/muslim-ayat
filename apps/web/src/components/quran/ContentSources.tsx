import { getContentSources } from "@muslim-ayat/quran-data/reader";
import { RightsReviewDetails } from "./RightsReviewDetails";

export function ContentSources() {
  const sources = getContentSources();

  return (
    <details className="rounded-2xl border border-[var(--line)] bg-white/70 p-5 text-sm">
      <summary className="cursor-pointer font-semibold text-[var(--green)]">
        Sources and rights information
      </summary>
      <ul className="mt-4 space-y-5 text-[var(--muted)]">
        {sources.map((item) => (
          <li key={item.id}>
            <p>
              <span className="font-medium text-[var(--ink)]">{item.name}</span> — {item.source};{" "}
              {item.edition}.
            </p>
            {item.attributionNote ? (
              <p className="mt-1">Source attribution note: {item.attributionNote}</p>
            ) : null}
            <p className="mt-1">License metadata: {item.license ?? "not recorded"}.</p>
            <RightsReviewDetails label={item.name} rightsReview={item.rightsReview} />
            <details className="mt-3 rounded-lg border border-[var(--line)] p-3 text-xs leading-5 text-[var(--muted)]">
              <summary className="cursor-pointer font-medium text-[var(--green)]">
                Technical source integrity
              </summary>
              {item.integrity ? (
                <div className="mt-2 space-y-1">
                  <p>
                    SHA-256: <code className="break-all">{item.integrity.sha256}</code>
                  </p>
                  <p>
                    Checksum recorded at{" "}
                    <time dateTime={item.integrity.verifiedAt}>{item.integrity.verifiedAt}</time>.
                    This confirms byte identity only, not rights or permissions.
                  </p>
                </div>
              ) : (
                <p className="mt-2">External source; no local content checksum is recorded.</p>
              )}
            </details>
            <a
              className="mt-2 inline-block font-medium text-[var(--green)] underline underline-offset-2"
              href={item.url}
              rel="noreferrer"
              target="_blank"
            >
              View source record
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
        This metadata disclosure is not a legal determination. Unknown permissions are not a grant;
        source integrity checks do not establish rights or redistribution permission.
      </p>
    </details>
  );
}