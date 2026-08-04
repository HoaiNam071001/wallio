"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { AccountBreakdownChart } from "@/components/charts/account-breakdown-chart";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionDetailDialog } from "@/components/transactions/transaction-detail-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { EntityIcon } from "@/components/shared/entity-icon";
import { AmountTextForAccount } from "@/components/shared/amount-text";
import { ACCOUNT_TYPE_META } from "@/components/accounts/account-type";
import {
  useAccountBreakdown,
  useNetWorthSummary,
  usePeriodTotals,
} from "@/lib/hooks/use-summary";
import { useTransactions } from "@/lib/hooks/use-transactions";
import {
  DATE_RANGE_PRESET_LABELS,
  getPresetRange,
  toQueryDate,
  type DateRangePreset,
} from "@/lib/utils";
import type { TransactionWithRelations } from "@/lib/queries/transactions";

export default function DashboardPage() {
  const [preset, setPreset] = useState<DateRangePreset>("month");
  const [viewing, setViewing] = useState<TransactionWithRelations | null>(null);

  const { startDate, endDate } = useMemo(() => {
    const range = getPresetRange(preset === "custom" ? "month" : preset);
    return { startDate: toQueryDate(range.start), endDate: toQueryDate(range.end) };
  }, [preset]);

  const { data: netWorth } = useNetWorthSummary();
  const { data: totals } = usePeriodTotals(startDate, endDate);
  const { data: accountBreakdown } = useAccountBreakdown();
  const inKindAccounts = accountBreakdown?.filter((a) => a.type === "in_kind") ?? [];
  const { data: recentTransactions, isLoading: loadingTransactions } = useTransactions({
    limit: 6,
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Tổng quan" subtitle="Bức tranh tài chính của bạn" amountScope="dashboard" />

      {netWorth && <SummaryCards summary={netWorth} />}

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Thu / Chi</CardTitle>
          <Tabs value={preset} onValueChange={(v) => setPreset(v as DateRangePreset)}>
            <TabsList className="h-9">
              {(["today", "week", "month", "year"] as DateRangePreset[]).map((p) => (
                <TabsTrigger key={p} value={p} className="px-2.5 text-xs">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Số dư theo nguồn tiền</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountBreakdownChart data={accountBreakdown ?? []} scope="dashboard" />
        </CardContent>
      </Card>

      {inKindAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hiện vật</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2.5">
              {inKindAccounts.map((item) => {
                const meta = ACCOUNT_TYPE_META.in_kind;
                return (
                  <li key={item.accountId} className="flex items-center gap-2.5">
                    <EntityIcon
                      icon={item.icon ?? meta.icon}
                      color={item.color ?? meta.color}
                      className="size-9 rounded-xl"
                      iconClassName="size-4"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {item.accountName}
                    </span>
                    <AmountTextForAccount
                      amount={item.balance}
                      account={{ type: "in_kind", unit: item.unit }}
                      scope="dashboard"
                      className="shrink-0 text-sm font-bold tabular-nums"
                    />
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Gần đây</h2>
        <Link
          href="/transactions"
          className="flex items-center gap-0.5 text-sm font-semibold text-primary"
        >
          Xem tất cả
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {loadingTransactions ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : (
        <TransactionList
          transactions={recentTransactions ?? []}
          scope="dashboard"
          onView={setViewing}
          emptyLabel="Chưa có khoản nào được ghi."
        />
      )}

      <TransactionDetailDialog
        transaction={viewing}
        scope="dashboard"
        open={!!viewing}
        onOpenChange={(open) => !open && setViewing(null)}
        editHref="/transactions"
      />
    </div>
  );
}
