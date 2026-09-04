"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { CsvImportDialog } from "@/components/reports/csv-import-dialog";
import { CategoryBreakdownChart } from "@/components/charts/category-breakdown-chart";
import { ChartTypeToggle } from "@/components/charts/chart-type-toggle";
import { AccountBreakdownChart } from "@/components/charts/account-breakdown-chart";
import { AmountText } from "@/components/shared/amount-text";
import { useAccountBreakdown, useCategoryBreakdown, usePeriodTotals } from "@/lib/hooks/use-summary";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { useChartType } from "@/lib/hooks/use-chart-type";
import { useT } from "@/lib/i18n/use-t";
import { buildWallioExportCsv, downloadCsv } from "@/lib/utils/csv-export";
import { getPresetRange, toQueryDate, type DateRangePreset } from "@/lib/utils";

export function ReportsTab() {
  const { t } = useT();
  const [preset, setPreset] = useState<DateRangePreset>("month");
  const [customStart, setCustomStart] = useState(() => toQueryDate(getPresetRange("month").start));
  const [customEnd, setCustomEnd] = useState(() => toQueryDate(getPresetRange("month").end));
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [chartType, setChartType] = useChartType("reports");

  // DateRangeFilter luôn giữ customStart/customEnd khớp với preset đang chọn (kể cả sau khi
  // bấm nút prev/next điều hướng sang kỳ khác), nên chỉ cần đọc thẳng hai mốc này.
  const startDate = customStart;
  const endDate = customEnd;

  const { data: totals } = usePeriodTotals(startDate, endDate);
  const { data: categoryBreakdown } = useCategoryBreakdown(startDate, endDate, kind);
  const { data: accountBreakdown } = useAccountBreakdown();
  const { data: transactions } = useTransactions({ startDate, endDate });
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  function handleExport() {
    if (!transactions || !accounts || !categories) return;
    const csv = buildWallioExportCsv({ accounts, categories, transactions, startDate, endDate });
    downloadCsv(csv, `${t("reports.page.csvFilenamePrefix")}-${toQueryDate(new Date())}.csv`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-2">
        <CsvImportDialog />
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="size-4" />
          {t("reports.page.exportCsv")}
        </Button>
      </div>

      <DateRangeFilter
        value={{ preset, customStart, customEnd }}
        onChange={(next) => {
          setPreset(next.preset);
          setCustomStart(next.customStart);
          setCustomEnd(next.customEnd);
        }}
      />

      {totals && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: t("reports.page.income"), value: totals.income, className: "text-income" },
            { label: t("reports.page.expense"), value: totals.expense, className: "text-expense" },
            {
              label: t("reports.page.net"),
              value: totals.net,
              className: totals.net >= 0 ? "text-income" : "text-expense",
            },
          ].map((item) => (
            <div key={item.label} className="glass min-w-0 rounded-2xl px-2.5 py-2.5">
              <p className="truncate text-[11px] font-semibold text-muted-foreground">{item.label}</p>
              <AmountText
                amount={item.value}
                scope="reports"
                className={`block text-xs font-extrabold tabular-nums sm:text-sm ${item.className}`}
              />
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t("reports.page.byCategory")}</CardTitle>
          <div className="flex items-center gap-1.5">
            <ChartTypeToggle value={chartType} onChange={setChartType} />
            <Tabs value={kind} onValueChange={(v) => setKind(v as "income" | "expense")}>
              <TabsList className="h-9">
                <TabsTrigger value="expense" className="text-xs">
                  {t("transactions.page.expense")}
                </TabsTrigger>
                <TabsTrigger value="income" className="text-xs">
                  {t("transactions.page.income")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <CategoryBreakdownChart data={categoryBreakdown ?? []} scope="reports" variant={chartType} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("reports.page.byAccount")}</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountBreakdownChart data={accountBreakdown ?? []} scope="reports" />
        </CardContent>
      </Card>
    </div>
  );
}
