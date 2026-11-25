import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Muslim Ayat",
  description:
    "A Quran reader with source-attributed Arabic text, translation, transliteration, recitation, and study resources.",
  openGraph: {
    title: "Muslim Ayat",
    description: "Read, listen, understand and learn the Quran.",
    type: "website",
  },
};

const foundations = [
  {
    number: "01",
    title: "A carefully sourced foundation",
    description:
      "Reader text is structurally checked, attributed to its source, and shown with an honest rights-status note.",
  },
  {
    number: "02",
    title: "Yours to keep",
    description:
      "The reading experience is designed to work offline, with personal data kept separate and private.",
  },
  {
    number: "03",
    title: "Built to grow gently",
    description:
      "A calm reader with recitation, tafsir and word-by-word glosses, plus more resources after review.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 pb-16 sm:px-8">
      <header className="flex items-center justify-between border-b border-[var(--line)] py-5">
        <Link aria-label="Muslim Ayat home" className="flex items-center gap-3" href="/">
          <span className="grid size-10 place-items-center rounded-2xl bg-[var(--green)] text-[#f7f6ef]">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none">
              <path d="M4 6.5c2.8-.9 5.5-.5 8 1.1v11c-2.5-1.6-5.2-2-8-1.1v-11Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M20 6.5c-2.8-.9-5.5-.5-8 1.1v11c2.5-1.6 5.2-2 8-1.1v-11Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 7.6v11" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Muslim Ayat</span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-6 text-sm">
          <Link className="text-[var(--muted)] transition hover:text-[var(--green)]" href="/#approach">
            Our approach
          </Link>
          <Link
            className="rounded-full bg-[var(--green)] px-4 py-2.5 font-medium text-white transition hover:bg-[#1c5547]"
            href="/quran"
          >
            Open reader
          </Link>
        </nav>
      </header>

      <section className="relative overflow-hidden py-20 sm:py-28">
        <div aria-hidden="true" className="absolute -right-24 -top-10 size-80 rounded-full bg-[#e7eadc] blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#49715d]">
            A quieter space for reflection
          </p>
          <h1 className="max-w-3xl text-5xl font-medium leading-[1.08] tracking-[-0.045em] text-[var(--green)] sm:text-7xl">
            Welcome to your Quran experience
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted)]">
            No account required. Start reading immediately. Read, listen, and explore the Quran
            with a thoughtful, source-attributed experience.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              className="inline-flex items-center gap-3 rounded-full bg-[var(--green)] px-6 py-3.5 text-sm font-medium text-white transition hover:bg-[#1c5547]"
              href="/quran"
            >
              Read the Quran
              <span aria-hidden="true">↗</span>
            </Link>
            <span className="text-sm font-medium text-[var(--muted)]">Free guest access</span>
          </div>
        </div>
        <div className="relative mt-16 rounded-[2rem] border border-[#dfe5da] bg-[#edf0e7] p-6 sm:mt-20 sm:p-10">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#61786a]">
                Start with care
              </p>
              <h2 className="mt-3 max-w-lg text-2xl font-medium leading-snug tracking-tight text-[var(--green)] sm:text-3xl">
                Every resource deserves clear attribution.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[var(--muted)]">
              The reader includes the selected QUL Arabic text, Saheeh International translation
              and English transliteration. Resource-level rights information is unknown and
              disclosed in the reader; audio and study aids are separately attributed, with more
              resources planned after review.
            </p>
          </div>
          <div aria-hidden="true" className="mt-10 h-px bg-[#d8dfd3]" />
          <div className="mt-5 flex items-center justify-between text-xs text-[#61786a]">
            <span>Independent content · Private by design · Offline-minded</span>
            <span className="hidden sm:inline">An open foundation for learning</span>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="personalize-heading"
        className="mb-14 rounded-[2rem] border border-[var(--line)] bg-white/80 p-6 sm:p-9"
      >
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--green)]" id="personalize-heading">
            Want to personalize your experience?
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Sign in to save bookmarks, notes, reading progress and preferences across devices.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            className="rounded-full bg-[var(--green)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1c5547]"
            href="/sign-in"
          >
            Sign in
          </Link>
          <Link
            className="rounded-full border border-[var(--green)] px-5 py-2.5 text-sm font-medium text-[var(--green)] transition hover:bg-[#edf0e7]"
            href="/quran"
          >
            Continue reading as guest
          </Link>
        </div>
      </section>

      <section id="approach" className="grid gap-8 border-t border-[var(--line)] py-14 sm:grid-cols-3 sm:gap-10">
        {foundations.map((item) => (
          <article key={item.number}>
            <p className="text-xs font-semibold tracking-[0.16em] text-[#72907b]">{item.number}</p>
            <h2 className="mt-4 text-lg font-semibold tracking-tight text-[var(--green)]">
              {item.title}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--muted)]">
              {item.description}
            </p>
          </article>
        ))}
      </section>

      <footer className="flex flex-col gap-3 border-t border-[var(--line)] pt-6 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
        <span>Muslim Ayat · A Quran platform for everyone.</span>
        <span>Built with care. Rooted in reliable sources.</span>
      </footer>
    </main>
  );
}