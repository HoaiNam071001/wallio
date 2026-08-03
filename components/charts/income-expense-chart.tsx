"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

export function IncomeExpenseChart({ income, expense }: { income: number; expense: number }) {
  const data = [
    { name: "Thu nhập", value: income, fill: "var(--color-income)" },
    { name: "Chi tiêu", value: expense, fill: "var(--color-expense)" },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tickFormatter={(v) => new Intl.NumberFormat("vi-VN", { notation: "compact" }).format(v)}
        />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
