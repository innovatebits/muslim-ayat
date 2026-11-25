import {
  PersonalSyncOperationSchema,
  type PersonalSyncOperation,
} from "@muslim-ayat/shared";

export const OFFLINE_DATABASE_NAME = "muslim-ayat-offline-v1";
const DATABASE_VERSION = 2;

type StoreName = "bookmarks" | "notes" | "progress" | "outbox";

export interface OfflineBookmarkRecord {
  key: string;
  ownerId: string;
  surahNumber: number;
  ayahNumber: number;
  clientUpdatedAt: string;
  syncOperationId: string;
  isDeleted: boolean;
}

export interface OfflineNoteRecord {
  key: string;
  ownerId: string;
  clientId: string;
  surahNumber: number;
  ayahNumber: number;
  content: string;
  clientUpdatedAt: string;
  syncOperationId: string;
  isDeleted: boolean;
}

export interface OfflineProgressRecord {
  key: string;
  ownerId: string;
  surahNumber: number;
  ayahNumber: number;
  clientUpdatedAt: string;
  syncOperationId: string;
}

export type OfflinePersonalSyncOperation = PersonalSyncOperation & { recordKey: string };

export interface OfflinePersonalData {
  bookmarks: OfflineBookmarkRecord[];
  notes: OfflineNoteRecord[];
  progress: OfflineProgressRecord | null;
}

let databasePromise: Promise<IDBDatabase> | undefined;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this browser."));
  }
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (database.objectStoreNames.contains("publicQuran")) {
        database.deleteObjectStore("publicQuran");
      }
      if (!database.objectStoreNames.contains("bookmarks")) {
        const bookmarks = database.createObjectStore("bookmarks", { keyPath: "key" });
        bookmarks.createIndex("byOwnerId", "ownerId");
      }
      if (!database.objectStoreNames.contains("notes")) {
        const notes = database.createObjectStore("notes", { keyPath: "key" });
        notes.createIndex("byOwnerId", "ownerId");
      }
      if (!database.objectStoreNames.contains("progress")) {
        database.createObjectStore("progress", { keyPath: "key" });
      }
      if (!database.objectStoreNames.contains("outbox")) {
        const outbox = database.createObjectStore("outbox", { keyPath: "operationId" });
        outbox.createIndex("byOwnerId", "ownerId");
        outbox.createIndex("byRecordKey", "recordKey");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open offline data."));
    request.onblocked = () => reject(new Error("Offline data upgrade is blocked by another tab."));
  });

  return databasePromise;
}

function runTransaction<T>(
  stores: StoreName[],
  mode: IDBTransactionMode,
  run: (transaction: IDBTransaction, setResult: (value: T) => void) => void,
): Promise<T> {
  return openDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(stores, mode);
        let result: T;
        transaction.oncomplete = () => resolve(result);
        transaction.onerror = () => reject(transaction.error ?? new Error("Offline data operation failed."));
        transaction.onabort = () => reject(transaction.error ?? new Error("Offline data operation was aborted."));
        try {
          run(transaction, (value) => {
            result = value;
          });
        } catch (error) {
          transaction.abort();
          reject(error);
        }
      }),
  );
}

function now() {
  return new Date().toISOString();
}

function newId() {
  return crypto.randomUUID();
}

function bookmarkKey(ownerId: string, surahNumber: number, ayahNumber: number) {
  return `${ownerId}:${surahNumber}:${ayahNumber}`;
}

function noteKey(ownerId: string, clientId: string) {
  return `${ownerId}:${clientId}`;
}

function validateOperation(operation: PersonalSyncOperation) {
  return PersonalSyncOperationSchema.parse(operation);
}

function queueRecord<T>(
  store: "bookmarks" | "notes" | "progress",
  record: T,
  recordKey: string,
  operation: PersonalSyncOperation,
): Promise<T> {
  return runTransaction([store, "outbox"], "readwrite", (transaction, setResult) => {
    const outbox = transaction.objectStore("outbox");
    const queued = outbox.index("byRecordKey").getAll(recordKey);
    queued.onsuccess = () => {
      for (const previous of queued.result as OfflinePersonalSyncOperation[]) {
        if (previous.ownerId === operation.ownerId) outbox.delete(previous.operationId);
      }
      outbox.put({ ...operation, recordKey } satisfies OfflinePersonalSyncOperation);
      transaction.objectStore(store).put(record);
      setResult(record);
    };
  });
}

export function saveLocalBookmark(
  ownerId: string,
  surahNumber: number,
  ayahNumber: number,
  isDeleted = false,
) {
  const key = bookmarkKey(ownerId, surahNumber, ayahNumber);
  const operationId = newId();
  const changedAt = now();
  const operation = validateOperation({
    type: isDeleted ? "bookmark-delete" : "bookmark-upsert",
    operationId,
    ownerId,
    changedAt,
    surahNumber,
    ayahNumber,
  });
  const record: OfflineBookmarkRecord = {
    key,
    ownerId,
    surahNumber,
    ayahNumber,
    clientUpdatedAt: changedAt,
    syncOperationId: operationId,
    isDeleted,
  };
  return queueRecord("bookmarks", record, key, operation);
}

export function saveLocalNote(
  ownerId: string,
  surahNumber: number,
  ayahNumber: number,
  content: string,
  clientId = newId(),
) {
  const key = noteKey(ownerId, clientId);
  const operationId = newId();
  const changedAt = now();
  const operation = validateOperation({
    type: "note-upsert",
    operationId,
    ownerId,
    changedAt,
    clientId,
    surahNumber,
    ayahNumber,
    content,
  });
  if (operation.type !== "note-upsert") throw new Error("Invalid offline note operation.");
  const record: OfflineNoteRecord = {
    key,
    ownerId,
    clientId,
    surahNumber,
    ayahNumber,
    content: operation.content,
    clientUpdatedAt: changedAt,
    syncOperationId: operationId,
    isDeleted: false,
  };
  return queueRecord("notes", record, key, operation);
}

export function deleteLocalNote(record: OfflineNoteRecord) {
  const operationId = newId();
  const changedAt = now();
  const operation = validateOperation({
    type: "note-delete",
    operationId,
    ownerId: record.ownerId,
    changedAt,
    clientId: record.clientId,
    surahNumber: record.surahNumber,
    ayahNumber: record.ayahNumber,
  });
  return queueRecord(
    "notes",
    { ...record, content: "", clientUpdatedAt: changedAt, syncOperationId: operationId, isDeleted: true },
    record.key,
    operation,
  );
}

export function saveLocalProgress(ownerId: string, surahNumber: number, ayahNumber: number) {
  const key = ownerId;
  const operationId = newId();
  const changedAt = now();
  const operation = validateOperation({
    type: "progress-upsert",
    operationId,
    ownerId,
    changedAt,
    surahNumber,
    ayahNumber,
  });
  const record: OfflineProgressRecord = {
    key,
    ownerId,
    surahNumber,
    ayahNumber,
    clientUpdatedAt: changedAt,
    syncOperationId: operationId,
  };
  return queueRecord("progress", record, key, operation);
}

export function getOwnerBookmarks(ownerId: string): Promise<OfflineBookmarkRecord[]> {
  return runTransaction(["bookmarks"], "readonly", (transaction, setResult) => {
    const request = transaction.objectStore("bookmarks").index("byOwnerId").getAll(ownerId);
    request.onsuccess = () => setResult(request.result as OfflineBookmarkRecord[]);
  });
}

export function getOwnerNotes(ownerId: string): Promise<OfflineNoteRecord[]> {
  return runTransaction(["notes"], "readonly", (transaction, setResult) => {
    const request = transaction.objectStore("notes").index("byOwnerId").getAll(ownerId);
    request.onsuccess = () => setResult(request.result as OfflineNoteRecord[]);
  });
}

export function getOwnerProgress(ownerId: string): Promise<OfflineProgressRecord | undefined> {
  return runTransaction(["progress"], "readonly", (transaction, setResult) => {
    const request = transaction.objectStore("progress").get(ownerId);
    request.onsuccess = () => setResult(request.result as OfflineProgressRecord | undefined);
  });
}

export function getOwnerOutbox(ownerId: string): Promise<OfflinePersonalSyncOperation[]> {
  return runTransaction(["outbox"], "readonly", (transaction, setResult) => {
    const request = transaction.objectStore("outbox").index("byOwnerId").getAll(ownerId);
    request.onsuccess = () => setResult(request.result as OfflinePersonalSyncOperation[]);
  });
}

export function acknowledgeOutboxOperation(operationId: string) {
  return runTransaction(["outbox"], "readwrite", (transaction, setResult) => {
    transaction.objectStore("outbox").delete(operationId);
    setResult(undefined);
  });
}

export function storeRemoteBookmark(record: OfflineBookmarkRecord) {
  return runTransaction(["bookmarks"], "readwrite", (transaction, setResult) => {
    transaction.objectStore("bookmarks").put(record);
    setResult(record);
  });
}

export function storeRemoteNote(record: OfflineNoteRecord) {
  return runTransaction(["notes"], "readwrite", (transaction, setResult) => {
    transaction.objectStore("notes").put(record);
    setResult(record);
  });
}

export function storeRemoteProgress(record: OfflineProgressRecord) {
  return runTransaction(["progress"], "readwrite", (transaction, setResult) => {
    transaction.objectStore("progress").put(record);
    setResult(record);
  });
}

export async function getOwnerOfflineData(ownerId: string): Promise<OfflinePersonalData> {
  const [bookmarks, notes, progress] = await Promise.all([
    getOwnerBookmarks(ownerId),
    getOwnerNotes(ownerId),
    getOwnerProgress(ownerId),
  ]);

  return {
    bookmarks: bookmarks.filter((bookmark) => !bookmark.isDeleted),
    notes: notes.filter((note) => !note.isDeleted),
    progress: progress ?? null,
  };
}

export async function resetOfflineDatabaseForTests() {
  if (databasePromise) {
    const database = await databasePromise;
    database.close();
    databasePromise = undefined;
  }

  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(OFFLINE_DATABASE_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("Unable to reset offline data."));
    request.onblocked = () => reject(new Error("Offline database reset is blocked."));
  });
}