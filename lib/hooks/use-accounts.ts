"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/hooks/use-supabase";
import {
  createAccount,
  deleteAccount,
  getAccountBalanceAsOf,
  listAccountBalances,
  listAccounts,
  listAccountsWithBalance,
  updateAccount,
} from "@/lib/queries/accounts";
import {
  adjustAccountBalance,
  type AdjustBalanceInput,
} from "@/lib/queries/balance-adjustment";
import type { AccountInsert, AccountUpdate } from "@/lib/types/database.types";

export function useAccounts() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => listAccounts(supabase),
  });
}

export function useAccountBalances() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["account-balances"],
    queryFn: () => listAccountBalances(supabase),
  });
}

/** Account đầy đủ (icon, color, initial_balance) kèm số dư hiện tại. */
export function useAccountsWithBalance() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["accounts", "with-balance"],
    queryFn: () => listAccountsWithBalance(supabase),
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
