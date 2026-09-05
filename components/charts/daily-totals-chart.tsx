"use client";

import { format, parseISO } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAmountVisibility, type AmountVisibilityScope } from "@/lib/hooks/use-amount-visibility";
import { formatCompact, formatCurrency } from "@/lib/utils";
import { useT } from "@/lib/i18n/use-t";
import type { DailyTotalItem } from "@/lib/queries/summary";

const MASK = "••••••";
const MIN_BAR_GROUP_WIDTH = 28;

type Locale = typeof vi;

export type DailyChartView = "expense" | "income" | "both";

function TooltipCard({
  item,
  visible,
  dateLocale,
  view,
}: {
  item: DailyTotalItem;
  visible: boolean;
  dateLocale: Locale;
  view: DailyChartView;
}) {
  const { t } = useT();
  return (
    <div className="glass rounded-2xl px-3 py-2 text-xs">
      <p className="font-bold">{format(parseISO(item.date), "dd/MM/yyyy", { locale: dateLocale })}</p>
      {view !== "expense" && (
        <p className="text-income">
          {t("charts.incomeExpense.income")}: {visible ? formatCurrency(item.income) : MASK}
        </p>
      )}
      {view !== "income" && (
        <p className="text-expense">
          {t("charts.incomeExpense.expense")}: {visible ? formatCurrency(item.expense) : MASK}
        </p>
      )}
    </div>
  );
}

/**
 * Biểu đồ cột thu/chi theo từng ngày trong khoảng đang lọc. Chiều cao cột không bị ẩn theo tuỳ chọn
 * ẩn số tiền (giống IncomeExpenseChart) — chỉ nhãn trục Y và tooltip bị che thành "••••••", vì độ
 * cao cột vẫn cần thể hiện xu hướng tương đối dù đang ẩn số.
 */
export function DailyTotalsChart({
  data,
  scope,
  view = "both",
}: {
  data: DailyTotalItem[];
  scope: AmountVisibilityScope;
  view?: DailyChartView;
}) {
  const { t, locale } = useT();
  const dateLocale = locale === "en" ? enUS : vi;
  const [visible] = useAmountVisibility(scope);

  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{t("reports.dailyChart.empty")}</p>;
  }

  // Khoảng dài (vd preset Năm) cần cuộn ngang để cột không bị bóp lại quá hẹp, mất khả năng đọc.
  const minWidth = data.length * MIN_BAR_GROUP_WIDTH;

  return (
    <div className="hide-scrollbar overflow-x-auto">
      <div style={{ minWidth: `${minWidth}px` }} className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => format(parseISO(value), "dd/MM", { locale: dateLocale })}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(value: number) => (visible ? formatCompact(value) : MASK)}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <TooltipCard
                    item={payload[0].payload as DailyTotalItem}
                    visible={visible}
                    dateLocale={dateLocale}
                    view={view}
                  />
                ) : null
              }
            />
            {view !== "expense" && (
              <Bar dataKey="income" fill="var(--income)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            )}
            {view !== "income" && (
              <Bar dataKey="expense" fill="var(--expense)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
