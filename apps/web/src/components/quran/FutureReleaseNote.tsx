const availableResources = [
  { title: "Ayah recitation", detail: "External AlQuran Cloud streaming; rights status unknown and audio is not bundled." },
  { title: "Tafsir", detail: "QUL local export; resource ID unverified and rights status unknown." },
  { title: "English word-by-word", detail: "QUL resource #92; three missing glosses are left blank." },
];

const plannedResources = [
  { title: "More editions", detail: "Additional reciters, tafsir, translations, and study resources after review." },
  { title: "Offline audio", detail: "Optional user-initiated downloads after resource rights are clarified." },
];

export function FutureReleaseNote() {
  return (
    <section
      aria-labelledby="planned-resources-heading"
      className="rounded-3xl border border-dashed border-[#cbd6c9] bg-[#eef1e8] p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#61786a]">
        Available now · More planned
      </p>
      <h2
        className="mt-2 text-xl font-semibold tracking-tight text-[var(--green)]"
        id="planned-resources-heading"
      >
        Study resources and future additions
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
        Some external study resources are available with rights status unknown; this is not a
        statement of licence or redistribution clearance. More resources will follow review, with
        no release date promised.
      </p>
      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--green)]">Available now</h3>
          <ul className="mt-3 space-y-3">
            {availableResources.map((resource) => (
              <li className="rounded-2xl bg-white/75 p-4" key={resource.title}>
                <h4 className="text-sm font-semibold text-[var(--green)]">{resource.title}</h4>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{resource.detail}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--green)]">Planned for future releases</h3>
          <ul className="mt-3 space-y-3">
            {plannedResources.map((resource) => (
              <li className="rounded-2xl bg-white/75 p-4" key={resource.title}>
                <h4 className="text-sm font-semibold text-[var(--green)]">{resource.title}</h4>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{resource.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}