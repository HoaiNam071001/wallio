"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { AccountBreakdownItem } from "@/lib/queries/summary";

export function AccountBreakdownChart({ data }: { data: AccountBreakdownItem[] }) {
  if (data.length === 0) {
    return <p className="text-muted-foreground">Chưa có nguồn tiền nào.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tickFormatter={(v) => new Intl.NumberFormat("vi-VN", { notation: "compact" }).format(v)}
        />
        <YAxis
          type="category"
          dataKey="accountName"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          width={100}
        />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="balance" radius={[0, 6, 6, 0]} fill="var(--color-primary)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
