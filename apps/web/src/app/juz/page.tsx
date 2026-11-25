import type { Metadata } from "next";
import Link from "next/link";
import { getJuzIndex } from "@muslim-ayat/quran-data/juz";
import { getSurahIndex } from "@muslim-ayat/quran-data/reader";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Browse by Juz · Muslim Ayat",
  description: "Browse the Quran by its 30 Juz reading divisions and open any Juz in the public reader.",
};

export default function JuzPage() {
  const juzs = getJuzIndex();
  const surahs = getSurahIndex();

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 pb-16 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] py-5">
        <Link className="font-semibold tracking-tight text-[var(--green)]" href="/quran">
          ← Quran index
        </Link>
        <nav aria-label="Reader navigation" className="flex flex-wrap items-center gap-5 text-sm">
          <Link className="text-[var(--muted)] hover:text-[var(--green)]" href="/quran">
            Browse surahs
          </Link>
          <Link className="text-[var(--muted)] hover:text-[var(--green)]" href="/search">
            Search
          </Link>
        </nav>
      </header>

      <section className="py-12 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#72907b]">
          30 reading divisions
        </p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight text-[var(--green)] sm:text-6xl">
          Browse by Juz
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">
          Choose a Juz to open the existing reader at its first ayah. You can continue reading without signing in.
        </p>
      </section>

      <ol aria-label="Juz reading divisions" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {juzs.map((juz) => {
          const startSurah = surahs[juz.start.surah - 1];
          const endSurah = surahs[juz.end.surah - 1];
          const startName = startSurah?.nameTransliteration ?? `Surah ${juz.start.surah}`;
          const endName = endSurah?.nameTransliteration ?? `Surah ${juz.end.surah}`;

          return (
            <li key={juz.number}>
              <Link
                aria-label={`Read Juz ${juz.number}, starting at ${startName} ${juz.start.surah}:${juz.start.ayah}`}
                className="flex min-h-28 flex-col justify-between gap-4 rounded-2xl border border-[var(--line)] bg-white/80 p-5 transition hover:border-[#9aaf9f] hover:bg-white"
                href={`/surah/${juz.start.surah}#ayah-${juz.start.ayah}`}
              >
                <span className="text-lg font-semibold text-[var(--green)]">Juz {juz.number}</span>
                <span className="text-sm leading-6 text-[var(--muted)]">
                  Starts: {startName} {juz.start.surah}:{juz.start.ayah}
                  <br />
                  Ends: {endName} {juz.end.surah}:{juz.end.ayah}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <aside aria-label="Juz boundary sources" className="mt-10 border-t border-[var(--line)] pt-5 text-xs leading-5 text-[var(--muted)]">
        <p>
          Boundary references: <a className="underline underline-offset-2" href="https://api.quran.com/api/v4/juzs" rel="noreferrer" target="_blank">Quran.com Content API v4</a>,
          cross-checked against <a className="underline underline-offset-2" href="https://quran411.com/juz-breakdown" rel="noreferrer" target="_blank">Quran411</a>.
        </p>
        <p className="mt-2">Licensing for these boundary references has not been independently verified.</p>
      </aside>
    </main>
  );
}