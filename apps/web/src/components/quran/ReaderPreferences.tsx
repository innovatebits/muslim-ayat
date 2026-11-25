"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { ReaderPreferencesSchema, type ReaderPreferences } from "@muslim-ayat/shared";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type { ReaderPreferences } from "@muslim-ayat/shared";

type PreferenceSyncStatus = "checking" | "device-only" | "syncing" | "synced" | "error";

type ReaderPreferencesContextValue = {
  preferences: ReaderPreferences;
  isAuthenticated: boolean;
  syncStatus: PreferenceSyncStatus;
  showSignInPrompt: boolean;
  updatePreference: <Key extends keyof ReaderPreferences>(
    key: Key,
    value: ReaderPreferences[Key],
  ) => void;
  requestPreferenceSync: () => void;
  dismissSignInPrompt: () => void;
};

const STORAGE_KEY = "muslim-ayat-reader-preferences-v1";
const CHANGE_EVENT = "muslim-ayat-reader-preferences-change";
const DEFAULT_PREFERENCES: ReaderPreferences = {
  readingMode: "continuous",
  translationId: "saheeh-international",
  showTransliteration: true,
  arabicFontSize: "comfortable",
};

const ReaderPreferencesContext = createContext<ReaderPreferencesContextValue | null>(null);
let preferenceSnapshot = DEFAULT_PREFERENCES;
let hasLoadedSnapshot = false;

function parsePreferences(value: string | null): ReaderPreferences {
  if (!value) return DEFAULT_PREFERENCES;

  try {
    const parsed: unknown = JSON.parse(value);
    const result = ReaderPreferencesSchema.safeParse(parsed);
    return result.success ? result.data : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function ReaderPreferencesProvider({ children }: Readonly<{ children: ReactNode }>) {
  const preferences = useSyncExternalStore(
    subscribeToPreferences,
    getClientPreferences,
    getServerPreferences,
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<PreferenceSyncStatus>(() =>
    isSupabaseConfigured() ? "checking" : "device-only",
  );
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const activeUserIdRef = useRef<string | null>(null);
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);
  const preferenceRevisionRef = useRef(0);
  const pendingWriteRef = useRef<Promise<void>>(Promise.resolve());

  const syncPreferences = useCallback(
    (userId: string, value: ReaderPreferences) => {
      const client = clientRef.current;
      if (!client) return;

      setSyncStatus("syncing");
      const write = pendingWriteRef.current.catch(() => undefined).then(async () => {
        if (activeUserIdRef.current !== userId) return;
        const { error } = await client.from("profiles").upsert(
          {
            id: userId,
            reader_preferences: {
              readingMode: value.readingMode,
              translationId: value.translationId,
              showTransliteration: value.showTransliteration,
              arabicFontSize: value.arabicFontSize,
            },
          },
          { onConflict: "id" },
        );
        if (activeUserIdRef.current !== userId) return;
        setSyncStatus(error ? "error" : "synced");
      });
      pendingWriteRef.current = write.catch(() => setSyncStatus("error"));
    },
    [],
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let active = true;
    const client = createClient();
    clientRef.current = client;

    async function activateUser(userId: string | null) {
      activeUserIdRef.current = userId;
      setIsAuthenticated(Boolean(userId));
      setShowSignInPrompt(false);
      if (!userId) {
        setSyncStatus("device-only");
        return;
      }

      setSyncStatus("syncing");
      const preferenceRevision = preferenceRevisionRef.current;
      const { data, error } = await client
        .from("profiles")
        .select("reader_preferences")
        .eq("id", userId)
        .maybeSingle();
      if (!active || activeUserIdRef.current !== userId) return;
      if (preferenceRevisionRef.current !== preferenceRevision) {
        syncPreferences(userId, getClientPreferences());
        return;
      }
      if (error) {
        setSyncStatus("error");
        return;
      }

      const result = ReaderPreferencesSchema.safeParse(data?.reader_preferences);
      if (result.success) {
        storePreferences(result.data);
        setSyncStatus("synced");
      } else {
        syncPreferences(userId, getClientPreferences());
      }
    }

    const subscription = client.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => void activateUser(session?.user.id ?? null));
    }).data.subscription;
    void client.auth.getUser().then(({ data, error }) => {
      void activateUser(error ? null : data.user?.id ?? null);
    }).catch(() => {
      if (active) setSyncStatus("device-only");
    });

    return () => {
      active = false;
      activeUserIdRef.current = null;
      clientRef.current = null;
      subscription.unsubscribe();
    };
  }, [syncPreferences]);

  const updatePreference = useCallback(
    <Key extends keyof ReaderPreferences>(key: Key, value: ReaderPreferences[Key]) => {
      const current = getClientPreferences();
      const updated = ReaderPreferencesSchema.parse({ ...current, [key]: value });
      preferenceRevisionRef.current += 1;
      storePreferences(updated);
      const userId = activeUserIdRef.current;
      if (userId) syncPreferences(userId, updated);
    },
    [syncPreferences],
  );

  const requestPreferenceSync = useCallback(() => {
    const userId = activeUserIdRef.current;
    if (!userId) {
      setShowSignInPrompt(true);
      return;
    }
    syncPreferences(userId, getClientPreferences());
  }, [syncPreferences]);

  const dismissSignInPrompt = useCallback(() => setShowSignInPrompt(false), []);

  const value = useMemo<ReaderPreferencesContextValue>(
    () => ({
      preferences,
      isAuthenticated,
      syncStatus,
      showSignInPrompt,
      updatePreference,
      requestPreferenceSync,
      dismissSignInPrompt,
    }),
    [
      preferences,
      isAuthenticated,
      syncStatus,
      showSignInPrompt,
      updatePreference,
      requestPreferenceSync,
      dismissSignInPrompt,
    ],
  );

  return <ReaderPreferencesContext.Provider value={value}>{children}</ReaderPreferencesContext.Provider>;
}

export function useReaderPreferences() {
  const context = useContext(ReaderPreferencesContext);
  if (!context) throw new Error("Reader preferences require ReaderPreferencesProvider.");
  return context;
}

function getClientPreferences() {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  if (!hasLoadedSnapshot) {
    preferenceSnapshot = parsePreferences(window.localStorage.getItem(STORAGE_KEY));
    hasLoadedSnapshot = true;
  }
  return preferenceSnapshot;
}

function getServerPreferences() {
  return DEFAULT_PREFERENCES;
}

function storePreferences(preferences: ReaderPreferences) {
  preferenceSnapshot = preferences;
  hasLoadedSnapshot = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferenceSnapshot));
  } catch {
    window.dispatchEvent(new Event(CHANGE_EVENT));
    return;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribeToPreferences(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const handleChange = () => {
    preferenceSnapshot = parsePreferences(window.localStorage.getItem(STORAGE_KEY));
    hasLoadedSnapshot = true;
    onStoreChange();
  };

  window.addEventListener("storage", handleChange);
  window.addEventListener(CHANGE_EVENT, handleChange);
  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(CHANGE_EVENT, handleChange);
  };
}