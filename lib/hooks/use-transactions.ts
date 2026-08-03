"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/hooks/use-supabase";
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
  type TransactionFilters,
} from "@/lib/queries/transactions";
import type { TransactionInsert, TransactionUpdate } from "@/lib/types/database.types";

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["transactions"] });
  queryClient.invalidateQueries({ queryKey: ["account-balances"] });
  queryClient.invalidateQueries({ queryKey: ["summary"] });
}

export function useTransactions(filters: TransactionFilters = {}) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => listTransactions(supabase, filters),
  });
}

export function useCreateTransaction() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TransactionInsert) => createTransaction(supabase, input),
    onSuccess: () => invalidateAll(queryClient),
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
