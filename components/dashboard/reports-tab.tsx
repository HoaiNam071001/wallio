"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { CategoryBreakdownChart } from "@/components/charts/category-breakdown-chart";
import { AccountBreakdownChart } from "@/components/charts/account-breakdown-chart";
import { AmountText } from "@/components/shared/amount-text";
import { useAccountBreakdown, useCategoryBreakdown, usePeriodTotals } from "@/lib/hooks/use-summary";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Dictionary } from "@/lib/i18n/dictionaries/vi";
import { DATE_RANGE_PRESET_ORDER, getPresetRange, toQueryDate, type DateRangePreset } from "@/lib/utils";

function exportCsv(
  t: Dictionary,
  rows: {
    date: string;
    type: string;
    amount: number;
    account: string;
    category: string;
    note: string;
  }[],
) {
  const header = t.reports.page.csvHeader;
  const lines = rows.map((r) =>
    [r.date, r.type, r.amount, r.account, r.category, r.note]
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(","),
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${t.reports.page.csvFilenamePrefix}-${toQueryDate(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsTab() {
  const { t } = useTranslation();
  const [preset, setPreset] = useState<DateRangePreset>("month");
  const [customStart, setCustomStart] = useState(toQueryDate(new Date()));
  const [customEnd, setCustomEnd] = useState(toQueryDate(new Date()));
  const [kind, setKind] = useState<"income" | "expense">("expense");

  const { startDate, endDate } = useMemo(() => {
    if (preset === "custom") return { startDate: customStart, endDate: customEnd };
    const range = getPresetRange(preset);
    return { startDate: toQueryDate(range.start), endDate: toQueryDate(range.end) };
  }, [preset, customStart, customEnd]);

  const { data: totals } = usePeriodTotals(startDate, endDate);
  const { data: categoryBreakdown } = useCategoryBreakdown(startDate, endDate, kind);
  const { data: accountBreakdown } = useAccountBreakdown();
  const { data: transactions } = useTransactions({ startDate, endDate });

  function handleExport() {
    if (!transactions) return;
    exportCsv(
      t,
      transactions.map((tx) => ({
        date: tx.transaction_date,
        type: tx.type,
        amount: tx.amount,
        account:
          tx.type === "transfer"
            ? `${tx.account?.name ?? ""} → ${tx.to_account?.name ?? ""}`
            : (tx.account?.name ?? ""),
        category: tx.category?.name ?? "",
        note: tx.note ?? "",
      })),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="size-4" />
          CSV
        </Button>
      </div>

      <Tabs value={preset} onValueChange={(v) => setPreset(v as DateRangePreset)}>
        <TabsList className="grid w-full grid-cols-5">
          {DATE_RANGE_PRESET_ORDER.map((p) => (
            <TabsTrigger key={p} value={p} className="px-1 text-[11px] sm:text-sm">
              {t.dateRangePreset[p]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {preset === "custom" && (
        <div className="flex items-center gap-2">
          <DateField value={customStart} onChange={setCustomStart} className="flex-1" />
          <span className="text-xs font-bold text-muted-foreground">→</span>
          <DateField value={customEnd} onChange={setCustomEnd} className="flex-1" />
        </div>
      )}

      {totals && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: t.reports.page.income, value: totals.income, className: "text-income" },
            { label: t.reports.page.expense, value: totals.expense, className: "text-expense" },
            {
              label: t.reports.page.net,
              value: totals.net,
              className: totals.net >= 0 ? "text-income" : "text-expense",
            },
          ].map((item) => (
            <div key={item.label} className="glass rounded-2xl px-3 py-2.5">
              <p className="text-[11px] font-semibold text-muted-foreground">{item.label}</p>
              <AmountText
                amount={item.value}
                scope="reports"
                className={`block truncate text-sm font-extrabold tabular-nums ${item.className}`}
              />
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t.reports.page.byCategory}</CardTitle>
          <Tabs value={kind} onValueChange={(v) => setKind(v as "income" | "expense")}>
            <TabsList className="h-9">
              <TabsTrigger value="expense" className="text-xs">
                {t.transactions.page.expense}
              </TabsTrigger>
              <TabsTrigger value="income" className="text-xs">
                {t.transactions.page.income}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <CategoryBreakdownChart data={categoryBreakdown ?? []} scope="reports" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.reports.page.byAccount}</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountBreakdownChart data={accountBreakdown ?? []} scope="reports" />
        </CardContent>
      </Card>
    </div>
  );
}
