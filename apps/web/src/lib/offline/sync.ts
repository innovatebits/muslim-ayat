import type { Database } from "@muslim-ayat/database";
import {
  PersonalSyncOperationSchema,
  type PersonalSyncOperation,
} from "@muslim-ayat/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  acknowledgeOutboxOperation,
  getOwnerBookmarks,
  getOwnerNotes,
  getOwnerOutbox,
  getOwnerProgress,
  storeRemoteBookmark,
  storeRemoteNote,
  storeRemoteProgress,
  type OfflineBookmarkRecord,
  type OfflineNoteRecord,
  type OfflineProgressRecord,
} from "./repository";

type Client = SupabaseClient<Database>;
type VersionedRecord = { clientUpdatedAt: string; syncOperationId: string };

export type RemoteSyncRecord =
  | { kind: "bookmark"; record: OfflineBookmarkRecord }
  | { kind: "note"; record: OfflineNoteRecord }
  | { kind: "progress"; record: OfflineProgressRecord };

export type RemoteSyncSnapshot = {
  bookmarks: OfflineBookmarkRecord[];
  notes: OfflineNoteRecord[];
  progress: OfflineProgressRecord | null;
};

export interface OfflineSyncAdapter {
  getAuthenticatedUserId: () => Promise<string | null>;
  apply: (operation: PersonalSyncOperation) => Promise<RemoteSyncRecord>;
  pull: (ownerId: string) => Promise<RemoteSyncSnapshot>;
}

export function compareRecordVersions(left: VersionedRecord, right: VersionedRecord) {
  const timestampDifference = Date.parse(left.clientUpdatedAt) - Date.parse(right.clientUpdatedAt);
  if (timestampDifference !== 0) return timestampDifference;
  return left.syncOperationId.localeCompare(right.syncOperationId);
}

function toOfflineBookmark(ownerId: string, row: Database["public"]["Tables"]["bookmarks"]["Row"]): OfflineBookmarkRecord {
  return {
    key: `${ownerId}:${row.surah_number}:${row.ayah_number}`,
    ownerId,
    surahNumber: row.surah_number,
    ayahNumber: row.ayah_number,
    clientUpdatedAt: row.client_updated_at,
    syncOperationId: row.sync_operation_id,
    isDeleted: row.is_deleted,
  };
}

function toOfflineNote(ownerId: string, row: Database["public"]["Tables"]["user_notes"]["Row"]): OfflineNoteRecord {
  return {
    key: `${ownerId}:${row.client_id}`,
    ownerId,
    clientId: row.client_id,
    surahNumber: row.surah_number,
    ayahNumber: row.ayah_number,
    content: row.content,
    clientUpdatedAt: row.client_updated_at,
    syncOperationId: row.sync_operation_id,
    isDeleted: row.is_deleted,
  };
}

function toOfflineProgress(
  ownerId: string,
  row: Database["public"]["Tables"]["reading_progress"]["Row"],
): OfflineProgressRecord {
  return {
    key: ownerId,
    ownerId,
    surahNumber: row.surah_number,
    ayahNumber: row.ayah_number,
    clientUpdatedAt: row.client_updated_at,
    syncOperationId: row.sync_operation_id,
  };
}

async function applyOperation(client: Client, operation: PersonalSyncOperation, ownerId: string) {
  if (operation.ownerId !== ownerId) throw new Error("Offline sync owner does not match the active account.");

  if (operation.type === "bookmark-upsert" || operation.type === "bookmark-delete") {
    const { data, error } = await client.rpc("sync_bookmark", {
      p_owner_id: ownerId,
      p_surah_number: operation.surahNumber,
      p_ayah_number: operation.ayahNumber,
      p_client_updated_at: operation.changedAt,
      p_sync_operation_id: operation.operationId,
      p_is_deleted: operation.type === "bookmark-delete",
    });
    if (error) throw error;
    if (!data) throw new Error("Bookmark sync returned no record.");
    return { kind: "bookmark" as const, record: toOfflineBookmark(ownerId, data) };
  }

  if (operation.type === "note-upsert" || operation.type === "note-delete") {
    const { data, error } = await client.rpc("sync_note", {
      p_owner_id: ownerId,
      p_client_id: operation.clientId,
      p_surah_number: operation.surahNumber,
      p_ayah_number: operation.ayahNumber,
      p_content: operation.type === "note-upsert" ? operation.content : "Deleted note",
      p_client_updated_at: operation.changedAt,
      p_sync_operation_id: operation.operationId,
      p_is_deleted: operation.type === "note-delete",
    });
    if (error) throw error;
    if (!data) throw new Error("Note sync returned no record.");
    return { kind: "note" as const, record: toOfflineNote(ownerId, data) };
  }

  const { data, error } = await client.rpc("sync_reading_progress", {
    p_owner_id: ownerId,
    p_surah_number: operation.surahNumber,
    p_ayah_number: operation.ayahNumber,
    p_client_updated_at: operation.changedAt,
    p_sync_operation_id: operation.operationId,
  });
  if (error) throw error;
  if (!data) throw new Error("Reading progress sync returned no record.");
  return { kind: "progress" as const, record: toOfflineProgress(ownerId, data) };
}

async function pullRemoteChanges(client: Client, ownerId: string): Promise<RemoteSyncSnapshot> {
  const [bookmarksResult, notesResult, progressResult] = await Promise.all([
    client.from("bookmarks").select("*").eq("user_id", ownerId).limit(1000),
    client.from("user_notes").select("*").eq("user_id", ownerId).limit(1000),
    client.from("reading_progress").select("*").eq("user_id", ownerId).maybeSingle(),
  ]);
  if (bookmarksResult.error || notesResult.error || progressResult.error) {
    throw bookmarksResult.error ?? notesResult.error ?? progressResult.error;
  }

  return {
    bookmarks: bookmarksResult.data.map((row) => toOfflineBookmark(ownerId, row)),
    notes: notesResult.data.map((row) => toOfflineNote(ownerId, row)),
    progress: progressResult.data ? toOfflineProgress(ownerId, progressResult.data) : null,
  };
}

async function mergeRemoteSnapshot(ownerId: string, remote: RemoteSyncSnapshot) {
  const [localBookmarks, localNotes, localProgress] = await Promise.all([
    getOwnerBookmarks(ownerId),
    getOwnerNotes(ownerId),
    getOwnerProgress(ownerId),
  ]);
  const localBookmarkMap = new Map(
    localBookmarks.map((record) => [`${record.surahNumber}:${record.ayahNumber}`, record]),
  );
  const localNoteMap = new Map(localNotes.map((record) => [record.clientId, record]));

  for (const remoteBookmark of remote.bookmarks) {
    const local = localBookmarkMap.get(`${remoteBookmark.surahNumber}:${remoteBookmark.ayahNumber}`);
    if (!local || compareRecordVersions(remoteBookmark, local) > 0) {
      await storeRemoteBookmark(remoteBookmark);
    }
  }
  for (const remoteNote of remote.notes) {
    const local = localNoteMap.get(remoteNote.clientId);
    if (!local || compareRecordVersions(remoteNote, local) > 0) await storeRemoteNote(remoteNote);
  }
  if (remote.progress) {
    if (!localProgress || compareRecordVersions(remote.progress, localProgress) > 0) {
      await storeRemoteProgress(remote.progress);
    }
  }
}

export async function synchronizeWithAdapter(
  ownerId: string,
  adapter: OfflineSyncAdapter,
  isOnline = typeof navigator === "undefined" || navigator.onLine,
) {
  if (!isOnline) {
    return { status: "offline" as const, synced: 0 };
  }

  if ((await adapter.getAuthenticatedUserId()) !== ownerId) {
    return { status: "different-user" as const, synced: 0 };
  }

  const operations = (await getOwnerOutbox(ownerId)).sort((left, right) => {
    const timeDifference = Date.parse(left.changedAt) - Date.parse(right.changedAt);
    return timeDifference || left.operationId.localeCompare(right.operationId);
  });
  let synced = 0;

  for (const queued of operations) {
    const untrustedOperation = Object.fromEntries(
      Object.entries(queued).filter(([key]) => key !== "recordKey"),
    );
    const operation = PersonalSyncOperationSchema.parse(untrustedOperation);
    if (operation.ownerId !== ownerId) continue;

    const remoteRecord = await adapter.apply(operation);
    if (remoteRecord.kind === "bookmark") await storeRemoteBookmark(remoteRecord.record);
    if (remoteRecord.kind === "note") await storeRemoteNote(remoteRecord.record);
    if (remoteRecord.kind === "progress") await storeRemoteProgress(remoteRecord.record);
    await acknowledgeOutboxOperation(operation.operationId);
    synced += 1;
  }

  await mergeRemoteSnapshot(ownerId, await adapter.pull(ownerId));
  return { status: "synced" as const, synced };
}

export function synchronizeOfflineData(client: Client, ownerId: string) {
  const adapter: OfflineSyncAdapter = {
    getAuthenticatedUserId: async () => {
      const { data, error } = await client.auth.getUser();
      if (error) throw error;
      return data.user?.id ?? null;
    },
    apply: (operation) => applyOperation(client, operation, ownerId),
    pull: (activeOwnerId) => pullRemoteChanges(client, activeOwnerId),
  };
  return synchronizeWithAdapter(ownerId, adapter);
}