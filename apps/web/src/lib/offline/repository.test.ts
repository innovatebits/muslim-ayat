import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getOwnerOfflineData,
  getOwnerOutbox,
  getOwnerNotes,
  OFFLINE_DATABASE_NAME,
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
  it("removes the write-only Quran store on upgrade without losing personal records", async () => {
    const ownerId = "00000000-0000-4000-8000-000000000101";
    const bookmark = {
      key: `${ownerId}:1:1`,
      ownerId,
      surahNumber: 1,
      ayahNumber: 1,
      clientUpdatedAt: "2026-01-01T00:00:00.000Z",
      syncOperationId: "00000000-0000-4000-8000-000000000102",
      isDeleted: false,
    };

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(OFFLINE_DATABASE_NAME, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        const publicQuran = database.createObjectStore("publicQuran", { keyPath: "key" });
        publicQuran.put({ key: "surah:1", surahNumber: 1 });
        const bookmarks = database.createObjectStore("bookmarks", { keyPath: "key" });
        bookmarks.createIndex("byOwnerId", "ownerId");
      };
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("bookmarks", "readwrite");
        transaction.objectStore("bookmarks").put(bookmark);
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => {
          database.close();
          reject(transaction.error);
        };
      };
      request.onerror = () => reject(request.error);
    });

    expect((await getOwnerOfflineData(ownerId)).bookmarks).toEqual([bookmark]);

    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(OFFLINE_DATABASE_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    expect(database.version).toBe(2);
    expect(Array.from(database.objectStoreNames)).not.toContain("publicQuran");
    database.close();
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