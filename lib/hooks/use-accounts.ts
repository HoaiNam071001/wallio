"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/hooks/use-supabase";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  createAccount,
  deleteAccount,
  getAccountBalanceAsOf,
  listAccountBalances,
  listAccounts,
  listAccountsWithBalance,
  reorderAccounts,
  updateAccount,
} from "@/lib/queries/accounts";
import {
  adjustAccountBalance,
  type AdjustBalanceInput,
} from "@/lib/queries/balance-adjustment";
import { accountsWithBalanceCacheKey, withOfflineCache } from "@/lib/offline/cache";
import type {
  AccountInsert,
  AccountUpdate,
  AccountWithBalance,
} from "@/lib/types/database.types";

export function useAccounts() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => listAccounts(supabase),
    retry: false,
  });
}

export function useAccountBalances() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["account-balances"],
    queryFn: () => listAccountBalances(supabase),
    retry: false,
  });
}

/** Account đầy đủ (icon, color, initial_balance) kèm số dư hiện tại — cache lại để xem offline. */
export function useAccountsWithBalance() {
  const supabase = useSupabase();
  const { user } = useAuth();
  return useQuery({
    queryKey: ["accounts", "with-balance"],
    queryFn: () =>
      withOfflineCache(accountsWithBalanceCacheKey(user!.id), () =>
        listAccountsWithBalance(supabase),
      ),
    enabled: !!user,
    retry: false,
  });
}

/** Số dư app đang tính cho một nguồn tiền tính đến hết ngày `date`. */
export function useAccountBalanceAsOf(accountId: string | undefined, date: string) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["accounts", "balance-as-of", accountId, date],
    queryFn: () => getAccountBalanceAsOf(supabase, accountId!, date),
    enabled: !!accountId && !!date,
  });
}

/** Ghi bút toán cân đối để số dư khớp với số tiền thực tế. */
export function useAdjustBalance() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdjustBalanceInput) => adjustAccountBalance(supabase, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account-balances"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

export function useCreateAccount() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AccountInsert) => createAccount(supabase, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account-balances"] });
    },
  });
}

export function useUpdateAccount() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AccountUpdate }) =>
      updateAccount(supabase, id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account-balances"] });
    },
  });
}

/**
 * Lưu thứ tự mới sau khi kéo-thả sắp xếp lại account. Cập nhật cache ["accounts", "with-balance"]
 * ngay lập tức (optimistic) để UI không nháy về thứ tự cũ trong lúc chờ request, rollback nếu lỗi.
 */
export function useReorderAccounts() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const queryKey = ["accounts", "with-balance"];

  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderAccounts(supabase, orderedIds),
    onMutate: async (orderedIds: string[]) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<AccountWithBalance[]>(queryKey);

      if (previous) {
        const byId = new Map(previous.map((a) => [a.id, a]));
        const reordered = orderedIds.map((id) => byId.get(id)).filter((a) => !!a);
        queryClient.setQueryData<AccountWithBalance[]>(queryKey, reordered);
      }

      return { previous };
    },
    onError: (_err, _orderedIds, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteAccount() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAccount(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account-balances"] });
    },
  });
}
