import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { TransactionInsert } from "@/lib/types/database.types";

export interface PendingTransaction {
  localId: string;
  userId: string;
  input: TransactionInsert;
  createdAt: string;
}

interface CacheEntry<T> {
  key: string;
  data: T;
  cachedAt: string;
}

interface WallioOfflineSchema extends DBSchema {
  kv: {
    key: string;
    value: CacheEntry<unknown>;
  };
  pendingTransactions: {
    key: string;
    value: PendingTransaction;
  };
}

const DB_NAME = "wallio-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<WallioOfflineSchema>> | null = null;

/** Chỉ mở 1 lần, dùng lại singleton — tất cả thao tác offline đều đi qua đây. */
function getDb() {
  if (typeof indexedDB === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB<WallioOfflineSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("kv")) {
          db.createObjectStore("kv", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("pendingTransactions")) {
          db.createObjectStore("pendingTransactions", { keyPath: "localId" });
        }
      },
    });
  }
  return dbPromise;
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const entry = await db.get("kv", key);
  return entry?.data as T | undefined;
}

export async function kvSet<T>(key: string, data: T): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.put("kv", { key, data, cachedAt: new Date().toISOString() });
}

export async function pendingTransactionsGetAll(): Promise<PendingTransaction[]> {
  const db = await getDb();
  if (!db) return [];
  return db.getAll("pendingTransactions");
}

export async function pendingTransactionPut(record: PendingTransaction): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.put("pendingTransactions", record);
}

export async function pendingTransactionDelete(localId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete("pendingTransactions", localId);
}
