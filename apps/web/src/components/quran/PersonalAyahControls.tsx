"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  deleteLocalNote,
  getOwnerOfflineData,
  saveLocalBookmark,
  saveLocalNote,
  saveLocalProgress,
  type OfflineBookmarkRecord,
  type OfflineNoteRecord,
} from "@/lib/offline/repository";
import { synchronizeOfflineData } from "@/lib/offline/sync";
import { featureFlags } from "@/lib/features";

type OfflineStatus = "loading" | "local-only" | "pending" | "syncing" | "synced" | "error";

type PersonalAyahControlsProps = {
  surahNumber: number;
  ayahNumber: number;
};

export function PersonalAyahControls({
  surahNumber,
  ayahNumber,
}: PersonalAyahControlsProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bookmarks, setBookmarks] = useState<OfflineBookmarkRecord[]>([]);
  const [notes, setNotes] = useState<OfflineNoteRecord[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [status, setStatus] = useState<OfflineStatus>("loading");
  const [notesOpen, setNotesOpen] = useState(false);
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const activeOwnerRef = useRef<string | null>(null);
  const loadedOwnerRef = useRef<string | null>(null);
  const authUserIdRef = useRef<string | null>(null);
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);

  const refreshLocalData = useCallback(async (activeOwnerId: string) => {
    const data = await getOwnerOfflineData(activeOwnerId);
    if (activeOwnerRef.current !== activeOwnerId) return;
    setBookmarks(data.bookmarks);
    setNotes(data.notes);
  }, []);

  const syncOwnerData = useCallback(async (activeOwnerId: string, userId: string) => {
    const client = clientRef.current;
    if (!client || !navigator.onLine) {
      if (activeOwnerRef.current === activeOwnerId) setStatus("pending");
      return;
    }

    setStatus("syncing");
    try {
      await synchronizeOfflineData(client, userId);
      await refreshLocalData(activeOwnerId);
      if (activeOwnerRef.current === activeOwnerId) setStatus("synced");
    } catch {
      if (activeOwnerRef.current === activeOwnerId) setStatus("pending");
    }
  }, [refreshLocalData]);

  async function saveAndSync(write: (activeOwnerId: string) => Promise<unknown>) {
    const activeOwnerId = activeOwnerRef.current;
    if (!activeOwnerId || !authUserIdRef.current) {
      setShowAccountPrompt(true);
      return false;
    }

    setStatus("pending");
    try {
      await write(activeOwnerId);
      await refreshLocalData(activeOwnerId);
    } catch {
      if (activeOwnerRef.current === activeOwnerId) setStatus("error");
      return false;
    }

    const userId = authUserIdRef.current;
    if (userId) {
      await syncOwnerData(activeOwnerId, userId);
    } else if (activeOwnerRef.current === activeOwnerId) {
      setStatus("local-only");
    }
    return true;
  }

  useEffect(() => {
    let active = true;
    let generation = 0;
    const client = isSupabaseConfigured() ? createClient() : null;
    clientRef.current = client;

    async function activateOwner(userId: string | null) {
      if (userId && activeOwnerRef.current === userId && loadedOwnerRef.current === userId) return;
      activeOwnerRef.current = userId;
      loadedOwnerRef.current = null;
      authUserIdRef.current = userId;
      const currentGeneration = ++generation;
      setIsAuthenticated(Boolean(userId));
      setBookmarks([]);
      setNotes([]);
      setStatus(userId ? "loading" : "local-only");
      setNotesOpen(false);

      if (!userId) return;

      try {
        const data = await getOwnerOfflineData(userId);
        if (!active || generation !== currentGeneration) return;
        loadedOwnerRef.current = userId;
        setBookmarks(data.bookmarks);
        setNotes(data.notes);
        if (client && navigator.onLine) {
          await syncOwnerData(userId, userId);
        } else {
          setStatus("pending");
        }
      } catch {
        if (active && generation === currentGeneration) setStatus("error");
      }
    }

    const subscription = client?.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => void activateOwner(session?.user.id ?? null));
    }).data.subscription;

    if (client) {
      void client.auth.getSession().then(({ data }) => activateOwner(data.session?.user.id ?? null));
    } else {
      void activateOwner(null);
    }

    const handleOnline = () => {
      const activeOwnerId = activeOwnerRef.current;
      const userId = authUserIdRef.current;
      if (activeOwnerId && userId) void syncOwnerData(activeOwnerId, userId);
    };
    window.addEventListener("online", handleOnline);

    return () => {
      active = false;
      generation += 1;
      window.removeEventListener("online", handleOnline);
      subscription?.unsubscribe();
      clientRef.current = null;
    };
  }, [syncOwnerData]);

  const bookmark = bookmarks.find(
    (item) => item.surahNumber === surahNumber && item.ayahNumber === ayahNumber,
  );
  const ayahNotes = notes.filter(
    (item) => item.surahNumber === surahNumber && item.ayahNumber === ayahNumber,
  );

  async function handleAddNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = noteDraft;
    if (await saveAndSync((activeOwnerId) => saveLocalNote(activeOwnerId, surahNumber, ayahNumber, content))) {
      setNoteDraft("");
    }
  }

  const statusMessage = {
    loading: "Loading saved items…",
    "local-only": "Sign in to save personal items.",
    pending: "Saved locally. Changes will sync when your account is online.",
    syncing: "Syncing your changes…",
    synced: "Saved and synced to your account.",
    error: "Could not save this change locally. Check browser storage availability and try again.",
  }[status];

  return (
    <section aria-label={`Personal actions for ayah ${ayahNumber}`} className="mt-5 rounded-xl border border-[var(--line)] bg-white/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        Personal actions · Ayah {ayahNumber}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--green)] disabled:opacity-50"
          disabled={status === "loading"}
          onClick={() => {
            if (!isAuthenticated) {
              setShowAccountPrompt(true);
              return;
            }
            void saveAndSync((activeOwnerId) =>
              saveLocalBookmark(activeOwnerId, surahNumber, ayahNumber, Boolean(bookmark)),
            );
          }}
          type="button"
        >
          {bookmark ? "Remove bookmark" : "Save bookmark"}
        </button>
        <button
          className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--green)] disabled:opacity-50"
          disabled={status === "loading"}
          onClick={() => {
            if (!isAuthenticated) {
              setShowAccountPrompt(true);
              return;
            }
            void saveAndSync((activeOwnerId) => saveLocalProgress(activeOwnerId, surahNumber, ayahNumber));
          }}
          type="button"
        >
          Save reading position
        </button>
        <button
          aria-expanded={isAuthenticated && notesOpen}
          className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--green)]"
          onClick={() => {
            if (!isAuthenticated) {
              setShowAccountPrompt(true);
              return;
            }
            setNotesOpen((open) => !open);
          }}
          type="button"
        >
          Notes ({ayahNotes.length})
        </button>
        {featureFlags.notes && isAuthenticated && notesOpen ? (
          <div className="mt-3 w-full min-w-64 space-y-3">
            {ayahNotes.map((note) => (
              <div key={note.clientId} className="rounded-lg bg-[#f7f6ef] p-3">
                <p className="whitespace-pre-wrap text-sm text-[var(--ink)]">{note.content}</p>
                <button
                  className="mt-2 text-xs font-medium text-[var(--muted)] hover:text-rose-700"
                  onClick={() => void saveAndSync(() => deleteLocalNote(note))}
                  type="button"
                >
                  Delete note
                </button>
              </div>
            ))}
            <form className="space-y-2" onSubmit={handleAddNote}>
              <label className="block text-xs font-medium text-[var(--ink)]" htmlFor={`note-${surahNumber}-${ayahNumber}`}>
                Add a private note
                <textarea
                  className="mt-1 block w-full rounded-lg border border-[var(--line)] bg-white p-2 text-sm"
                  id={`note-${surahNumber}-${ayahNumber}`}
                  maxLength={10_000}
                  onChange={(event) => setNoteDraft(event.currentTarget.value)}
                  required
                  rows={3}
                  value={noteDraft}
                />
              </label>
              <button
                className="rounded-full bg-[var(--green)] px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
                disabled={status === "loading"}
                type="submit"
              >
                Save note
              </button>
            </form>
          </div>
        ) : null}
      </div>
      {isAuthenticated ? (
        <p aria-live="polite" className="mt-3 text-xs text-[var(--muted)]" role="status">
          {statusMessage}
        </p>
      ) : null}
      {showAccountPrompt ? (
        <aside
          aria-labelledby="personalization-prompt-heading"
          className="mt-4 rounded-xl border border-[#dfe5da] bg-[#edf0e7] p-4"
          role="status"
        >
          <h2 className="text-sm font-semibold text-[var(--green)]" id="personalization-prompt-heading">
            Want to personalize your experience?
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Sign in to save the personal features enabled on this deployment across devices.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link className="rounded-full bg-[var(--green)] px-4 py-2 text-sm font-medium text-white" href="/sign-in">
              Sign in
            </Link>
            <button
              className="rounded-full border border-[var(--green)] px-4 py-2 text-sm font-medium text-[var(--green)]"
              onClick={() => setShowAccountPrompt(false)}
              type="button"
            >
              Continue reading as guest
            </button>
          </div>
        </aside>
      ) : null}
    </section>
  );
}