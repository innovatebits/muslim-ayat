import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalSyncOperation } from "@muslim-ayat/shared";
import {
  getOwnerOfflineData,
  getOwnerOutbox,
  resetOfflineDatabaseForTests,
  saveLocalBookmark,
  saveLocalNote,
} from "./repository";
import {
  compareRecordVersions,
  synchronizeWithAdapter,
  type OfflineSyncAdapter,
  type RemoteSyncRecord,
} from "./sync";

let uuidCounter = 100;

beforeEach(async () => {
  uuidCounter = 100;
  vi.stubGlobal("crypto", {
    randomUUID: () => `00000000-0000-4000-8000-${String(++uuidCounter).padStart(12, "0")}`,
  });
  await resetOfflineDatabaseForTests();
});

afterEach(async () => {
  await resetOfflineDatabaseForTests();
  vi.unstubAllGlobals();
});

function bookmarkResult(ownerId: string, operation: PersonalSyncOperation): RemoteSyncRecord {
  if (operation.type !== "bookmark-upsert" && operation.type !== "bookmark-delete") {
    throw new Error("Expected a bookmark operation.");
  }
  return {
    kind: "bookmark",
    record: {
      key: `${ownerId}:${operation.surahNumber}:${operation.ayahNumber}`,
      ownerId,
      surahNumber: operation.surahNumber,
      ayahNumber: operation.ayahNumber,
      clientUpdatedAt: operation.changedAt,
      syncOperationId: operation.operationId,
      isDeleted: operation.type === "bookmark-delete",
    },
  };
}

describe("offline synchronization", () => {
  it("leaves edits queued offline, retries failures, and makes successful replay idempotent", async () => {
    const ownerId = "00000000-0000-4000-8000-000000000301";
    await saveLocalBookmark(ownerId, 1, 1);
    let attempts = 0;
    const adapter: OfflineSyncAdapter = {
      getAuthenticatedUserId: async () => ownerId,
      apply: async (operation) => {
        attempts += 1;
        if (attempts === 1) throw new Error("temporary network failure");
        return bookmarkResult(ownerId, operation);
      },
      pull: async () => ({ bookmarks: [], notes: [], progress: null }),
    };

    expect(await synchronizeWithAdapter(ownerId, adapter, false)).toMatchObject({ status: "offline" });
    expect(await getOwnerOutbox(ownerId)).toHaveLength(1);
    await expect(synchronizeWithAdapter(ownerId, adapter, true)).rejects.toThrow("temporary network failure");
    expect(await getOwnerOutbox(ownerId)).toHaveLength(1);

    expect(await synchronizeWithAdapter(ownerId, adapter, true)).toMatchObject({ status: "synced", synced: 1 });
    expect(await getOwnerOutbox(ownerId)).toHaveLength(0);
    expect(await synchronizeWithAdapter(ownerId, adapter, true)).toMatchObject({ synced: 0 });
    expect(attempts).toBe(2);
  });

  it("does not sync one user's queue while another user is active", async () => {
    const ownerId = "00000000-0000-4000-8000-000000000401";
    await saveLocalBookmark(ownerId, 2, 1);
    const apply = vi.fn(async (operation: PersonalSyncOperation) => bookmarkResult(ownerId, operation));
    const adapter: OfflineSyncAdapter = {
      getAuthenticatedUserId: async () => "00000000-0000-4000-8000-000000000402",
      apply,
      pull: async () => ({ bookmarks: [], notes: [], progress: null }),
    };

    expect(await synchronizeWithAdapter(ownerId, adapter, true)).toMatchObject({
      status: "different-user",
      synced: 0,
    });
    expect(apply).not.toHaveBeenCalled();
    expect(await getOwnerOutbox(ownerId)).toHaveLength(1);
  });

  it("uses timestamp then operation ID to resolve concurrent record versions", async () => {
    const first = {
      clientUpdatedAt: "2026-11-25T00:00:00.000Z",
      syncOperationId: "00000000-0000-4000-8000-000000000001",
    };
    const newerTime = { ...first, clientUpdatedAt: "2026-11-25T00:00:01.000Z" };
    const newerId = { ...first, syncOperationId: "00000000-0000-4000-8000-000000000002" };

    expect(compareRecordVersions(newerTime, first)).toBeGreaterThan(0);
    expect(compareRecordVersions(newerId, first)).toBeGreaterThan(0);
    expect(compareRecordVersions(first, newerId)).toBeLessThan(0);
  });

  it("accepts the remote winner for a note conflict and stores it locally", async () => {
    const ownerId = "00000000-0000-4000-8000-000000000501";
    const clientId = "00000000-0000-4000-8000-000000000502";
    await saveLocalNote(ownerId, 1, 1, "Local draft", clientId);
    const remoteNote = {
      key: `${ownerId}:${clientId}`,
      ownerId,
      clientId,
      surahNumber: 1,
      ayahNumber: 1,
      content: "Remote newer note",
      clientUpdatedAt: "2099-01-01T00:00:00.000Z",
      syncOperationId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      isDeleted: false,
    };
    const adapter: OfflineSyncAdapter = {
      getAuthenticatedUserId: async () => ownerId,
      apply: async () => ({ kind: "note", record: remoteNote }),
      pull: async () => ({ bookmarks: [], notes: [remoteNote], progress: null }),
    };

    await synchronizeWithAdapter(ownerId, adapter, true);

    expect((await getOwnerOfflineData(ownerId)).notes[0]?.content).toBe("Remote newer note");
    expect(await getOwnerOutbox(ownerId)).toHaveLength(0);
  });
});