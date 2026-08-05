"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { AccountBreakdownChart } from "@/components/charts/account-breakdown-chart";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionDetailDialog } from "@/components/transactions/transaction-detail-dialog";
import { SkeletonView } from "@/components/ui/skeleton";
import { transactionRowsSkeleton } from "@/lib/skeleton/shapes";
import { EntityIcon } from "@/components/shared/entity-icon";
import { AmountTextForAccount } from "@/components/shared/amount-text";
import { ACCOUNT_TYPE_META } from "@/components/accounts/account-type";
import { ROUTES } from "@/lib/constants/routes";
import {
  useAccountBreakdown,
  useNetWorthSummary,
  usePeriodTotals,
} from "@/lib/hooks/use-summary";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useT } from "@/lib/i18n/use-t";
import { getPresetRange, toQueryDate, type DateRangePreset } from "@/lib/utils";
import type { TransactionWithRelations } from "@/lib/queries/transactions";

export function OverviewTab() {
  const { t } = useT();
  const [preset, setPreset] = useState<DateRangePreset>("month");
  const [customStart, setCustomStart] = useState(toQueryDate(new Date()));
  const [customEnd, setCustomEnd] = useState(toQueryDate(new Date()));
  const [viewing, setViewing] = useState<TransactionWithRelations | null>(null);
  const rowsShape = useMemo(() => transactionRowsSkeleton(3), []);

  const { startDate, endDate } = useMemo(() => {
    if (preset === "custom") return { startDate: customStart, endDate: customEnd };
    const range = getPresetRange(preset);
    return { startDate: toQueryDate(range.start), endDate: toQueryDate(range.end) };
  }, [preset, customStart, customEnd]);

  const { data: netWorth } = useNetWorthSummary();
  const { data: totals } = usePeriodTotals(startDate, endDate);
  const { data: accountBreakdown } = useAccountBreakdown();
  const inKindAccounts = accountBreakdown?.filter((a) => a.type === "in_kind") ?? [];
  const { data: recentTransactions, isLoading: loadingTransactions } = useTransactions({
    limit: 6,
  });

  return (
    <div className="flex flex-col gap-4">
      {netWorth && <SummaryCards summary={netWorth} />}

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t("dashboard.page.incomeExpense")}</CardTitle>
          <DateRangeFilter
            value={{ preset, customStart, customEnd }}
            onChange={(next) => {
              setPreset(next.preset);
              setCustomStart(next.customStart);
              setCustomEnd(next.customEnd);
            }}
          />
        </CardHeader>
        <CardContent>
          {totals && <IncomeExpenseChart income={totals.income} expense={totals.expense} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("dashboard.page.balanceByAccount")}</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountBreakdownChart data={accountBreakdown ?? []} scope="dashboard" />
        </CardContent>
      </Card>

      {inKindAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.page.inKind")}</CardTitle>
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
        <h2 className="text-lg font-bold">{t("dashboard.page.recent")}</h2>
        <Link
          href={ROUTES.transactions}
          className="flex items-center gap-0.5 text-sm font-semibold text-primary"
        >
          {t("dashboard.page.viewAll")}
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {loadingTransactions ? (
        <SkeletonView loading instance={rowsShape} />
      ) : (
        <TransactionList
          transactions={recentTransactions ?? []}
          scope="dashboard"
          onView={setViewing}
          emptyLabel={t("dashboard.page.emptyRecent")}
        />
      )}

      <TransactionDetailDialog
        transaction={viewing}
        scope="dashboard"
        open={!!viewing}
        onOpenChange={(open) => !open && setViewing(null)}
        editHref={ROUTES.transactions}
      />
    </div>
  );
}
