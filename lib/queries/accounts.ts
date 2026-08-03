import type { SupabaseClient } from "@supabase/supabase-js";
import type { Account, AccountBalance, AccountInsert, AccountUpdate, Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export async function listAccounts(supabase: Client): Promise<Account[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function listAccountBalances(supabase: Client): Promise<AccountBalance[]> {
  const { data, error } = await supabase
    .from("account_balances")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createAccount(supabase: Client, input: AccountInsert): Promise<Account> {
  const { data, error } = await supabase.from("accounts").insert(input).select().single();

  if (error) throw error;
  return data;
}

export async function updateAccount(
  supabase: Client,
  id: string,
  input: AccountUpdate,
): Promise<Account> {
  const { data, error } = await supabase
    .from("accounts")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAccount(supabase: Client, id: string): Promise<void> {
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) throw error;
}
