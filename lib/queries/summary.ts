import type { SupabaseClient } from "@supabase/supabase-js";
import { eachDayOfInterval, parseISO } from "date-fns";
import type { Database } from "@/lib/types/database.types";
import { listAccountBalances, listAccountsWithBalance } from "@/lib/queries/accounts";
import { toQueryDate } from "@/lib/utils/date-range";

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

export interface CategoryComparisonItem {
  categoryId: string | null;
  categoryName: string;
  color: string | null;
  icon: string | null;
  currentTotal: number;
  previousTotal: number;
  /** null khi previousTotal = 0 — tránh chia cho 0, UI hiện nhãn "Mới" thay vì phần trăm. */
  changePercent: number | null;
  trend: "up" | "down" | "flat";
}

/**
 * So sánh chi tiêu/thu nhập theo danh mục giữa kỳ hiện tại và một kỳ so sánh (kỳ trước hoặc cùng kỳ
 * năm trước) — gộp kiểu full outer join theo categoryId, để danh mục chỉ phát sinh ở một trong hai kỳ
 * vẫn được liệt kê thay vì rớt mất.
 */
export async function getCategoryComparison(
  supabase: Client,
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string,
  kind: "income" | "expense",
): Promise<CategoryComparisonItem[]> {
  const [current, previous] = await Promise.all([
    getCategoryBreakdown(supabase, currentStart, currentEnd, kind),
    getCategoryBreakdown(supabase, previousStart, previousEnd, kind),
  ]);

  const previousByKey = new Map(previous.map((item) => [item.categoryId ?? "uncategorized", item]));
  const items = current.map((item) => {
    const key = item.categoryId ?? "uncategorized";
    const previousItem = previousByKey.get(key);
    previousByKey.delete(key);
    return buildComparisonItem(item, previousItem?.total ?? 0);
  });

  // Danh mục còn lại trong previousByKey là những danh mục có ở kỳ trước nhưng kỳ này không còn phát sinh.
  for (const previousItem of previousByKey.values()) {
    items.push(
      buildComparisonItem(
        { ...previousItem, total: 0 },
        previousItem.total,
      ),
    );
  }

  return items.sort((a, b) => b.currentTotal - a.currentTotal || b.previousTotal - a.previousTotal);
}

function buildComparisonItem(
  current: CategoryBreakdownItem,
  previousTotal: number,
): CategoryComparisonItem {
  const changePercent = previousTotal === 0 ? null : ((current.total - previousTotal) / previousTotal) * 100;
  const trend: CategoryComparisonItem["trend"] =
    changePercent === null
      ? current.total > 0
        ? "up"
        : "flat"
      : Math.abs(changePercent) < 0.5
        ? "flat"
        : changePercent > 0
          ? "up"
          : "down";

  return {
    categoryId: current.categoryId,
    categoryName: current.categoryName,
    color: current.color,
    icon: current.icon,
    currentTotal: current.total,
    previousTotal,
    changePercent,
    trend,
  };
}

export interface DailyTotalItem {
  date: string;
  income: number;
  expense: number;
}

/**
 * Tổng thu/chi theo từng ngày trong khoảng [startDate, endDate], dùng cho biểu đồ cột theo ngày.
 * Lấp đủ mọi ngày kể cả không có giao dịch (income/expense = 0) để trục ngày không bị Recharts
 * tự bỏ qua ngày trống.
 */
export async function getDailyTotals(
  supabase: Client,
  startDate: string,
  endDate: string,
): Promise<DailyTotalItem[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount, transaction_date")
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate)
    .in("type", ["income", "expense"]);

  if (error) throw error;

  const byDate = new Map<string, DailyTotalItem>();
  for (const row of data) {
    const amount = Number(row.amount) || 0;
    const existing = byDate.get(row.transaction_date) ?? {
      date: row.transaction_date,
      income: 0,
      expense: 0,
    };
    if (row.type === "income") existing.income += amount;
    else if (row.type === "expense") existing.expense += amount;
    byDate.set(row.transaction_date, existing);
  }

  return eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) }).map((day) => {
    const key = toQueryDate(day);
    return byDate.get(key) ?? { date: key, income: 0, expense: 0 };
  });
}

export interface AccountBreakdownItem {
  accountId: string;
  accountName: string;
  color: string | null;
  icon: string | null;
  type: string;
  unit: string | null;
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
    unit: a.unit,
    balance: a.current_balance,
  }));
}
