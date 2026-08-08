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
    .order("sort_order", { ascending: true })
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
  const [accounts, balances, activity] = await Promise.all([
    listAccounts(supabase),
    listAccountBalances(supabase),
    listLastActivityDates(supabase),
  ]);

  const balanceById = new Map(balances.map((b) => [b.account_id, Number(b.current_balance) || 0]));

  return accounts.map((account) => ({
    ...account,
    initial_balance: Number(account.initial_balance) || 0,
    current_balance: balanceById.get(account.id) ?? (Number(account.initial_balance) || 0),
    last_activity_date: activity.get(account.id) ?? null,
  }));
}

/** Ngày ghi nhận gần nhất của từng nguồn tiền — dùng để cảnh báo số dư đã cũ. */
async function listLastActivityDates(supabase: Client): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("transactions")
    .select("account_id, to_account_id, transaction_date")
    .order("transaction_date", { ascending: false });

  if (error) throw error;

  const latest = new Map<string, string>();
  for (const row of data) {
    for (const id of [row.account_id, row.to_account_id]) {
      if (!id) continue;
      const current = latest.get(id);
      if (!current || row.transaction_date > current) latest.set(id, row.transaction_date);
    }
  }
  return latest;
}

/**
 * Số dư của một nguồn tiền TÍNH ĐẾN hết ngày `date` (đã bao gồm số dư ban đầu).
 * Cần cho việc cân đối: chốt số thực tế tại một mốc thời gian cụ thể.
 */
export async function getAccountBalanceAsOf(
  supabase: Client,
  accountId: string,
  date: string,
): Promise<number> {
  const [{ data: account, error: accountError }, { data: rows, error: rowsError }] =
    await Promise.all([
      supabase.from("accounts").select("initial_balance").eq("id", accountId).single(),
      supabase
        .from("transactions")
        .select("type, amount, to_amount, account_id, to_account_id")
        .lte("transaction_date", date)
        .or(`account_id.eq.${accountId},to_account_id.eq.${accountId}`),
    ]);

  if (accountError) throw accountError;
  if (rowsError) throw rowsError;

  let balance = Number(account.initial_balance) || 0;
  for (const row of rows) {
    const amount = Number(row.amount) || 0;
    if (row.account_id === accountId) {
      if (row.type === "income") balance += amount;
      else balance -= amount; // expense và transfer đi ra đều làm giảm số dư
    }
    if (row.to_account_id === accountId && row.type === "transfer") {
      balance += row.to_amount != null ? Number(row.to_amount) || 0 : amount;
    }
  }
  return balance;
}

export async function createAccount(supabase: Client, input: AccountInsert): Promise<Account> {
  const { data, error } = await supabase.from("accounts").insert(input).select().single();

  if (error) throw error;
  return data;
}

/** Tạo nhiều account cùng lúc — dùng khi nhập CSV, một round-trip thay vì N lần insert đơn. */
export async function bulkCreateAccounts(
  supabase: Client,
  inputs: AccountInsert[],
): Promise<Account[]> {
  if (inputs.length === 0) return [];
  const { data, error } = await supabase.from("accounts").insert(inputs).select();

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

/** Ghi lại thứ tự hiển thị sau khi kéo-thả sắp xếp lại — `orderedIds` là thứ tự mới từ trên xuống. */
export async function reorderAccounts(supabase: Client, orderedIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("accounts").update({ sort_order: index }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

export async function deleteAccount(supabase: Client, id: string): Promise<void> {
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) throw error;
}

/** Xoá nhiều account cùng lúc — dùng để rollback thủ công nếu 1 bước sau trong import thất bại. */
export async function bulkDeleteAccounts(supabase: Client, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from("accounts").delete().in("id", ids);
  if (error) throw error;
}
