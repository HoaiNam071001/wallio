"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { TransactionList } from "@/components/transactions/transaction-list";
import { useNetWorthSummary, usePeriodTotals } from "@/lib/hooks/use-summary";
import { useTransactions } from "@/lib/hooks/use-transactions";
import {
  DATE_RANGE_PRESET_LABELS,
  getPresetRange,
  toQueryDate,
  type DateRangePreset,
} from "@/lib/utils";

export default function DashboardPage() {
  const [preset, setPreset] = useState<DateRangePreset>("month");

  const { startDate, endDate } = useMemo(() => {
    const range = getPresetRange(preset === "custom" ? "month" : preset);
    return { startDate: toQueryDate(range.start), endDate: toQueryDate(range.end) };
  }, [preset]);

  const { data: netWorth } = useNetWorthSummary();
  const { data: totals } = usePeriodTotals(startDate, endDate);
  const { data: recentTransactions, isLoading: loadingTransactions } = useTransactions({
    limit: 8,
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Tổng quan</h1>

      {netWorth && <SummaryCards summary={netWorth} />}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Thu / Chi</CardTitle>
          <Tabs value={preset} onValueChange={(v) => setPreset(v as DateRangePreset)}>
            <TabsList>
              {(["today", "week", "month", "year"] as DateRangePreset[]).map((p) => (
                <TabsTrigger key={p} value={p} className="text-xs">
                  {DATE_RANGE_PRESET_LABELS[p]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {totals && <IncomeExpenseChart income={totals.income} expense={totals.expense} />}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Giao dịch gần đây</h2>
        <Button variant="link" asChild>
          <Link href="/transactions">Xem tất cả</Link>
        </Button>
      </div>

      {loadingTransactions ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : (
        <TransactionList transactions={recentTransactions ?? []} />
      )}
    </div>
  );
}
