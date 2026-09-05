"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/lib/hooks/use-supabase";
import {
  getAccountBreakdown,
  getCategoryBreakdown,
  getCategoryComparison,
  getDailyTotals,
  getNetWorthSummary,
  getPeriodTotals,
} from "@/lib/queries/summary";

export function useNetWorthSummary() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["summary", "net-worth"],
    queryFn: () => getNetWorthSummary(supabase),
  });
}

export function usePeriodTotals(startDate: string, endDate: string) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["summary", "period-totals", startDate, endDate],
    queryFn: () => getPeriodTotals(supabase, startDate, endDate),
  });
}

export function useCategoryBreakdown(
  startDate: string,
  endDate: string,
  kind: "income" | "expense",
) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["summary", "category-breakdown", startDate, endDate, kind],
    queryFn: () => getCategoryBreakdown(supabase, startDate, endDate, kind),
  });
}

export function useCategoryComparison(
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string,
  kind: "income" | "expense",
) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["summary", "category-comparison", currentStart, currentEnd, previousStart, previousEnd, kind],
    queryFn: () => getCategoryComparison(supabase, currentStart, currentEnd, previousStart, previousEnd, kind),
  });
}

export function useDailyTotals(startDate: string, endDate: string) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["summary", "daily-totals", startDate, endDate],
    queryFn: () => getDailyTotals(supabase, startDate, endDate),
  });
}

export function useAccountBreakdown() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["summary", "account-breakdown"],
    queryFn: () => getAccountBreakdown(supabase),
  });
}
