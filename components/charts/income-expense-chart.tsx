"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { AmountText } from "@/components/shared/amount-text";

/**
 * So sánh thu / chi trong kỳ. Chỉ có hai giá trị nên dùng thanh tỉ lệ trực tiếp
 * (kèm nhãn số) thay vì biểu đồ cột — dễ đọc hơn trên màn hình hẹp.
 */
export function IncomeExpenseChart({ income, expense }: { income: number; expense: number }) {
  const max = Math.max(income, expense, 1);
  const rows = [
    {
      label: "Thu nhập",
      value: income,
      icon: ArrowDownLeft,
      color: "var(--income)",
    },
    {
      label: "Chi tiêu",
      value: expense,
      icon: ArrowUpRight,
      color: "var(--expense)",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <div key={row.label} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span
                className="flex size-7 items-center justify-center rounded-xl"
                style={{ backgroundColor: `color-mix(in oklab, ${row.color} 16%, transparent)`, color: row.color }}
              >
                <Icon className="size-4" />
              </span>
              <span className="text-sm font-semibold">{row.label}</span>
              <AmountText
                amount={row.value}
                scope="dashboard"
                className="ml-auto text-sm font-extrabold tabular-nums"
              />
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${(row.value / max) * 100}%`, backgroundColor: row.color }}
              />
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-between rounded-2xl bg-muted/60 px-3 py-2">
        <span className="text-sm font-semibold text-muted-foreground">Còn lại</span>
        <AmountText
          amount={income - expense}
          scope="dashboard"
          className={`text-base font-extrabold tabular-nums ${
            income - expense >= 0 ? "text-income" : "text-expense"
          }`}
        />
      </div>
    </div>
  );
}
