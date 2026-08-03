import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Account,
  AccountBalance,
  AccountInsert,
  AccountUpdate,
  AccountWithBalance,
  Database,
} from "@/lib/types/database.types";

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

/**
 * View `account_balances` chỉ có current_balance — không có icon/color/initial_balance.
 * Ghép thêm bảng `accounts` để màn hình quản lý có đủ dữ liệu hiển thị và sửa.
 */
export async function listAccountsWithBalance(supabase: Client): Promise<AccountWithBalance[]> {
  const [accounts, balances] = await Promise.all([
    listAccounts(supabase),
    listAccountBalances(supabase),
  ]);

  const balanceById = new Map(balances.map((b) => [b.account_id, Number(b.current_balance) || 0]));

  return accounts.map((account) => ({
    ...account,
    initial_balance: Number(account.initial_balance) || 0,
    current_balance: balanceById.get(account.id) ?? (Number(account.initial_balance) || 0),
  }));
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
