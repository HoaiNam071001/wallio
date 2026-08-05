import {
  pendingTransactionDelete,
  pendingTransactionPut,
  pendingTransactionsGetAll,
  type PendingTransaction,
} from "@/lib/offline/db";
import type { TransactionInsert } from "@/lib/types/database.types";

/**
 * Snapshot trong bộ nhớ của hàng đợi giao dịch offline, đồng bộ với IndexedDB — cùng pattern
 * external-store với `lib/hooks/use-currency.ts`/`use-theme.ts` để đọc/ghi tức thời ngoài React.
 */
let cached: PendingTransaction[] = [];
let hydrated = false;
let hydratingPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function hydrate(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (!hydratingPromise) {
    hydratingPromise = pendingTransactionsGetAll().then((records) => {
      cached = records;
      hydrated = true;
      notify();
    });
  }
  return hydratingPromise;
}

if (typeof window !== "undefined") void hydrate();

export function subscribePendingTransactions(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getPendingTransactionsSnapshot(): PendingTransaction[] {
  return cached;
}

export async function addPendingTransaction(input: TransactionInsert): Promise<PendingTransaction> {
  await hydrate();
  const record: PendingTransaction = {
    localId: crypto.randomUUID(),
    userId: input.user_id,
    input,
    createdAt: new Date().toISOString(),
  };
  cached = [...cached, record];
  notify();
  await pendingTransactionPut(record);
  return record;
}

export async function updatePendingTransaction(
  localId: string,
  input: TransactionInsert,
): Promise<void> {
  await hydrate();
  const existing = cached.find((record) => record.localId === localId);
  if (!existing) return;
  const updated: PendingTransaction = { ...existing, input };
  cached = cached.map((record) => (record.localId === localId ? updated : record));
  notify();
  await pendingTransactionPut(updated);
}

export async function removePendingTransaction(localId: string): Promise<void> {
  await hydrate();
  cached = cached.filter((record) => record.localId !== localId);
  notify();
  await pendingTransactionDelete(localId);
}

export async function clearPendingTransactions(localIds: string[]): Promise<void> {
  await hydrate();
  const toRemove = new Set(localIds);
  cached = cached.filter((record) => !toRemove.has(record.localId));
  notify();
  await Promise.all(localIds.map((localId) => pendingTransactionDelete(localId)));
}
