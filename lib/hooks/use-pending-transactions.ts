"use client";

import { useSyncExternalStore } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAccountsWithBalance } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import {
  getPendingTransactionsSnapshot,
  subscribePendingTransactions,
} from "@/lib/offline/pending-transactions";
import type { PendingTransaction } from "@/lib/offline/db";

export interface PendingTransactionView extends PendingTransaction {
  accountName: string;
  toAccountName: string | null;
  categoryName: string | null;
}

function getServerSnapshot(): PendingTransaction[] {
  return [];
}

/** Danh sách giao dịch đang chờ đồng bộ của user hiện tại, kèm tên account/category để hiển thị. */
export function usePendingTransactions() {
  const { user } = useAuth();
  const { data: accounts } = useAccountsWithBalance();
  const { data: categories } = useCategories();
  const all = useSyncExternalStore(
    subscribePendingTransactions,
    getPendingTransactionsSnapshot,
    getServerSnapshot,
  );

  const pending = all.filter((record) => record.userId === user?.id);

  const items: PendingTransactionView[] = pending.map((record) => ({
    ...record,
    accountName:
      accounts?.find((a) => a.id === record.input.account_id)?.name ?? record.input.account_id,
    toAccountName: record.input.to_account_id
      ? (accounts?.find((a) => a.id === record.input.to_account_id)?.name ??
        record.input.to_account_id)
      : null,
    categoryName: record.input.category_id
      ? (categories?.find((c) => c.id === record.input.category_id)?.name ?? null)
      : null,
  }));

  return { items, count: items.length };
}
