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

export async function removePendingTransaction(localId: string): Promise<void> {
  await hydrate();
  cached = cached.filter((record) => record.localId !== localId);
  notify();
  await pendingTransactionDelete(localId);
}
