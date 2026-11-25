import { getContentSources } from "@muslim-ayat/quran-data/reader";

export function ContentSources() {
  const sources = getContentSources();

  return (
    <details className="rounded-2xl border border-[var(--line)] bg-white/70 p-5 text-sm">
      <summary className="cursor-pointer font-semibold text-[var(--green)]">
        Sources and rights information
      </summary>
      <ul className="mt-4 space-y-3 text-[var(--muted)]">
        {sources.map((item) => (
          <li key={item.id}>
            <span className="font-medium text-[var(--ink)]">{item.name}</span> — {item.source.source};{" "}
            {item.source.edition}. Rights status: {item.source.rightsStatus}.{" "}
            {item.source.attributionNote ? `${item.source.attributionNote} ` : null}
            <a
              className="font-medium text-[var(--green)] underline underline-offset-2"
              href={item.source.url}
              rel="noreferrer"
              target="_blank"
            >
              View source
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
        Copyright and licence information was not available for these selected resources during our
        review. Unknown rights status does not mean public domain or permission to redistribute.
      </p>
    </details>
  );
}