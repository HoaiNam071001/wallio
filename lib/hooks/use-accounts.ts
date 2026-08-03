"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/hooks/use-supabase";
import {
  createAccount,
  deleteAccount,
  listAccountBalances,
  listAccounts,
  listAccountsWithBalance,
  updateAccount,
} from "@/lib/queries/accounts";
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
