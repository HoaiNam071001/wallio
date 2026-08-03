import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { listAccountBalances } from "@/lib/queries/accounts";

type Client = SupabaseClient<Database>;

export interface NetWorthSummary {
  netWorth: number;
  availableCash: number;
  lending: number;
  debt: number;
}

const LIQUID_TYPES = new Set(["cash", "ewallet", "bank"]);

export async function getNetWorthSummary(supabase: Client): Promise<NetWorthSummary> {
  const balances = await listAccountBalances(supabase);

  let availableCash = 0;
  let lending = 0;
  let debt = 0;

  for (const b of balances) {
    if (LIQUID_TYPES.has(b.type)) availableCash += b.current_balance;
    else if (b.type === "lending") lending += b.current_balance;
    else if (b.type === "debt") debt += Math.abs(b.current_balance);
  }

  const netWorth = availableCash + lending - debt;

  return { netWorth, availableCash, lending, debt };
}

export interface PeriodTotals {
  income: number;
  expense: number;
  net: number;
}

export async function getPeriodTotals(
  supabase: Client,
  startDate: string,
  endDate: string,
): Promise<PeriodTotals> {
  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount")
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate)
    .in("type", ["income", "expense"]);

  if (error) throw error;

  let income = 0;
  let expense = 0;
  for (const row of data) {
    if (row.type === "income") income += row.amount;
    else if (row.type === "expense") expense += row.amount;
  }

  return { income, expense, net: income - expense };
}

export interface CategoryBreakdownItem {
  categoryId: string | null;
  categoryName: string;
  total: number;
}

export async function getCategoryBreakdown(
  supabase: Client,
  startDate: string,
  endDate: string,
  kind: "income" | "expense",
): Promise<CategoryBreakdownItem[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("amount, category:categories(id,name)")
    .eq("type", kind)
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate);

  if (error) throw error;

  const totals = new Map<string, CategoryBreakdownItem>();
  for (const row of data as unknown as { amount: number; category: { id: string; name: string } | null }[]) {
    const key = row.category?.id ?? "uncategorized";
    const name = row.category?.name ?? "Không phân loại";
    const existing = totals.get(key);
    if (existing) existing.total += row.amount;
    else totals.set(key, { categoryId: row.category?.id ?? null, categoryName: name, total: row.amount });
  }

  return Array.from(totals.values()).sort((a, b) => b.total - a.total);
}

export interface AccountBreakdownItem {
  accountId: string;
  accountName: string;
  balance: number;
}

export async function getAccountBreakdown(supabase: Client): Promise<AccountBreakdownItem[]> {
  const balances = await listAccountBalances(supabase);
  return balances.map((b) => ({
    accountId: b.account_id,
    accountName: b.name,
    balance: b.current_balance,
  }));
}
