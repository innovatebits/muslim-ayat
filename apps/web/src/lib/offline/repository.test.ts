import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cachePublicSurah,
  getCachedPublicSurah,
  getOwnerOfflineData,
  getOwnerOutbox,
  getOwnerNotes,
  resetOfflineDatabaseForTests,
  saveLocalBookmark,
  saveLocalNote,
  saveLocalProgress,
  deleteLocalNote,
} from "./repository";

let uuidCounter = 0;

beforeEach(async () => {
  uuidCounter = 0;
  vi.stubGlobal("crypto", {
    randomUUID: () => `00000000-0000-4000-8000-${String(++uuidCounter).padStart(12, "0")}`,
  });
  await resetOfflineDatabaseForTests();
});

afterEach(async () => {
  await resetOfflineDatabaseForTests();
  vi.unstubAllGlobals();
});

describe("IndexedDB offline repository", () => {
  it("persists public Quran content separately from owner data", async () => {
    const surah = {
      number: 1,
      nameArabic: "الفاتحة",
      nameTransliteration: "Al-Fātiĥah",
      ayahCount: 1,
      ayahs: [{ number: 1, textUthmani: "بِسْمِ اللَّهِ", translation: "In the name of Allah.", transliteration: "Bismillah" }],
    };

    await cachePublicSurah(surah);

    expect(await getCachedPublicSurah(1)).toMatchObject({
      key: "surah:1",
      surahNumber: 1,
      content: surah,
    });
    expect(await getCachedPublicSurah(2)).toBeUndefined();
  });

  it("coalesces repeated bookmark edits and isolates owners", async () => {
    const ownerA = "00000000-0000-4000-8000-000000000101";
    const ownerB = "00000000-0000-4000-8000-000000000102";

    await saveLocalBookmark(ownerA, 1, 1);
    await saveLocalBookmark(ownerA, 1, 1, true);
    await saveLocalBookmark(ownerB, 1, 1);

    const ownerAOutbox = await getOwnerOutbox(ownerA);
    expect(ownerAOutbox).toHaveLength(1);
    expect(ownerAOutbox[0]?.type).toBe("bookmark-delete");
    expect((await getOwnerOfflineData(ownerA)).bookmarks).toEqual([]);
    expect((await getOwnerOfflineData(ownerB)).bookmarks).toHaveLength(1);
    expect(await getOwnerOutbox(ownerB)).toHaveLength(1);
  });

  it("keeps note tombstones and only the latest reading position in the outbox", async () => {
    const ownerId = "00000000-0000-4000-8000-000000000201";
    const clientId = "00000000-0000-4000-8000-000000000202";

    await saveLocalNote(ownerId, 2, 1, "A private note", clientId);
    const note = (await getOwnerNotes(ownerId))[0];
    expect(note).toBeDefined();
    await deleteLocalNote(note!);
    await saveLocalProgress(ownerId, 2, 1);
    await saveLocalProgress(ownerId, 2, 2);

    const outbox = await getOwnerOutbox(ownerId);
    expect(outbox).toHaveLength(2);
    expect(outbox.map((operation) => operation.type).sort()).toEqual([
      "note-delete",
      "progress-upsert",
    ]);
    expect((await getOwnerNotes(ownerId))[0]?.content).toBe("");
    expect((await getOwnerOfflineData(ownerId)).notes).toEqual([]);
    expect((await getOwnerOfflineData(ownerId)).progress?.ayahNumber).toBe(2);
  });
});