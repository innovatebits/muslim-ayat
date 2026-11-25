import type { Metadata } from "next";
import Link from "next/link";
import { ContentSources } from "@/components/quran/ContentSources";
import { ReaderSettings } from "@/components/quran/ReaderSettings";

export const metadata: Metadata = {
  title: "Reading settings",
  description: "Choose your Quran reading layout, translation, and transliteration preferences.",
};

export default function SettingsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 pb-16 pt-6 sm:px-8">
      <header className="flex items-center justify-between border-b border-[var(--line)] pb-5">
        <Link className="text-sm font-medium text-[var(--green)] hover:underline" href="/quran">
          ← Quran reader
        </Link>
        <nav aria-label="Account navigation" className="flex gap-4 text-sm">
          <Link className="text-[var(--muted)] hover:text-[var(--green)]" href="/bookmarks">
            Bookmarks
          </Link>
          <Link className="text-[var(--muted)] hover:text-[var(--green)]" href="/account">
            Account
          </Link>
        </nav>
      </header>
      <ReaderSettings />
      <div className="mt-10">
        <ContentSources />
      </div>
    </main>
  );
}