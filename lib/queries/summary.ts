import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { listAccountBalances, listAccountsWithBalance } from "@/lib/queries/accounts";

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
    const balance = Number(b.current_balance) || 0;
    if (LIQUID_TYPES.has(b.type)) availableCash += balance;
    else if (b.type === "lending") lending += balance;
    else if (b.type === "debt") debt += Math.abs(balance);
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
    const amount = Number(row.amount) || 0;
    if (row.type === "income") income += amount;
    else if (row.type === "expense") expense += amount;
  }

  return { income, expense, net: income - expense };
}

export interface CategoryBreakdownItem {
  categoryId: string | null;
  categoryName: string;
  color: string | null;
  icon: string | null;
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
    .select("amount, category:categories(id,name,color,icon)")
    .eq("type", kind)
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate);

  if (error) throw error;

  type Row = {
    amount: number;
    category: { id: string; name: string; color: string | null; icon: string | null } | null;
  };

  const totals = new Map<string, CategoryBreakdownItem>();
  for (const row of data as unknown as Row[]) {
    const key = row.category?.id ?? "uncategorized";
    const amount = Number(row.amount) || 0;
    const existing = totals.get(key);
    if (existing) {
      existing.total += amount;
      continue;
    }
    totals.set(key, {
      categoryId: row.category?.id ?? null,
      categoryName: row.category?.name ?? "Không phân loại",
      color: row.category?.color ?? null,
      icon: row.category?.icon ?? null,
      total: amount,
    });
  }

  return Array.from(totals.values()).sort((a, b) => b.total - a.total);
}

export interface AccountBreakdownItem {
  accountId: string;
  accountName: string;
  color: string | null;
  icon: string | null;
  type: string;
  balance: number;
}

export async function getAccountBreakdown(supabase: Client): Promise<AccountBreakdownItem[]> {
  const accounts = await listAccountsWithBalance(supabase);
  return accounts.map((a) => ({
    accountId: a.id,
    accountName: a.name,
    color: a.color,
    icon: a.icon,
    type: a.type,
    balance: a.current_balance,
  }));
}
