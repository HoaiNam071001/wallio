"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/hooks/use-supabase";
import { isOnline } from "@/lib/hooks/use-online-status";
import { addPendingTransaction } from "@/lib/offline/pending-transactions";
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
  type TransactionFilters,
} from "@/lib/queries/transactions";
import type { Transaction, TransactionInsert, TransactionUpdate } from "@/lib/types/database.types";

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["transactions"] });
  queryClient.invalidateQueries({ queryKey: ["account-balances"] });
  queryClient.invalidateQueries({ queryKey: ["summary"] });
}

/** Lỗi do mất mạng giữa chừng (khác lỗi nghiệp vụ từ Supabase, vd RLS/validation). */
function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && /fetch/i.test(error.message);
}

export type CreateTransactionResult = Transaction | { queued: true; localId: string };

export function useTransactions(filters: TransactionFilters = {}) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => listTransactions(supabase, filters),
  });
}

const INFINITE_PAGE_SIZE = 20;

/** Danh sách giao dịch phân trang kiểu "Xem thêm" — dùng cho sổ thu chi thay vì tải hết một lần. */
export function useInfiniteTransactions(
  filters: Omit<TransactionFilters, "limit" | "offset"> = {},
  pageSize: number = INFINITE_PAGE_SIZE,
) {
  const supabase = useSupabase();
  return useInfiniteQuery({
    queryKey: ["transactions", "infinite", filters, pageSize],
    queryFn: ({ pageParam }) =>
      listTransactions(supabase, { ...filters, limit: pageSize, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < pageSize ? undefined : allPages.length * pageSize,
  });
}

/**
 * Offline (hoặc mất mạng giữa chừng) thì xếp vào hàng đợi local thay vì báo lỗi — đồng bộ lại sau
 * qua màn hình Sync (`components/transactions/sync-offline-modal.tsx`).
 */
export function useCreateTransaction() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TransactionInsert): Promise<CreateTransactionResult> => {
      if (!isOnline()) {
        const record = await addPendingTransaction(input);
        return { queued: true, localId: record.localId };
      }
      try {
        return await createTransaction(supabase, input);
      } catch (error) {
        if (!isNetworkError(error)) throw error;
        const record = await addPendingTransaction(input);
        return { queued: true, localId: record.localId };
      }
    },
    onSuccess: (result) => {
      if (!("queued" in result)) invalidateAll(queryClient);
    },
  });
}

export function useUpdateTransaction() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TransactionUpdate }) =>
      updateTransaction(supabase, id, input),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useDeleteTransaction() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(supabase, id),
    onSuccess: () => invalidateAll(queryClient),
  });
}
