"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryBreakdownChart } from "@/components/charts/category-breakdown-chart";
import { AccountBreakdownChart } from "@/components/charts/account-breakdown-chart";
import { useAccountBreakdown, useCategoryBreakdown, usePeriodTotals } from "@/lib/hooks/use-summary";
import { useTransactions } from "@/lib/hooks/use-transactions";
import {
  DATE_RANGE_PRESET_LABELS,
  formatCurrency,
  getPresetRange,
  toQueryDate,
  type DateRangePreset,
} from "@/lib/utils";

function exportCsv(rows: { date: string; type: string; amount: number; account: string; category: string; note: string }[]) {
  const header = ["Ngày", "Loại", "Số tiền", "Nguồn tiền", "Danh mục", "Ghi chú"];
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
  a.download = `giao-dich-${toQueryDate(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
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
      transactions.map((t) => ({
        date: t.transaction_date,
        type: t.type,
        amount: t.amount,
        account: t.type === "transfer" ? `${t.account?.name ?? ""} → ${t.to_account?.name ?? ""}` : t.account?.name ?? "",
        category: t.category?.name ?? "",
        note: t.note ?? "",
      })),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Báo cáo</h1>
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4" />
          Xuất CSV
        </Button>
      </div>

      <Tabs value={preset} onValueChange={(v) => setPreset(v as DateRangePreset)}>
        <TabsList className="grid w-full grid-cols-5">
          {(Object.keys(DATE_RANGE_PRESET_LABELS) as DateRangePreset[]).map((p) => (
            <TabsTrigger key={p} value={p} className="text-xs sm:text-sm">
              {DATE_RANGE_PRESET_LABELS[p]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {preset === "custom" && (
        <div className="flex gap-2">
          <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
          <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
        </div>
      )}

      {totals && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Thu nhập</span>
              <span className="text-lg font-semibold text-income">{formatCurrency(totals.income)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Chi tiêu</span>
              <span className="text-lg font-semibold text-expense">{formatCurrency(totals.expense)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Chênh lệch</span>
              <span className="text-lg font-semibold">{formatCurrency(totals.net)}</span>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Theo danh mục</CardTitle>
          <Tabs value={kind} onValueChange={(v) => setKind(v as "income" | "expense")}>
            <TabsList>
              <TabsTrigger value="expense">Chi tiêu</TabsTrigger>
              <TabsTrigger value="income">Thu nhập</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <CategoryBreakdownChart data={categoryBreakdown ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Theo nguồn tiền</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountBreakdownChart data={accountBreakdown ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
