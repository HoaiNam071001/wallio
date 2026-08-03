"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { CategoryBreakdownItem } from "@/lib/queries/summary";

const PALETTE = [
  "oklch(0.65 0.19 25)",
  "oklch(0.7 0.15 150)",
  "oklch(0.65 0.18 260)",
  "oklch(0.75 0.15 80)",
  "oklch(0.65 0.2 330)",
  "oklch(0.7 0.13 200)",
  "oklch(0.6 0.15 40)",
  "oklch(0.7 0.1 300)",
];

export function CategoryBreakdownChart({ data }: { data: CategoryBreakdownItem[] }) {
  if (data.length === 0) {
    return <p className="text-muted-foreground">Không có dữ liệu trong khoảng thời gian này.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="categoryName"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={entry.categoryId ?? "uncategorized"} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
