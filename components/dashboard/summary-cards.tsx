import { HandCoins, Landmark, Receipt, Wallet } from "lucide-react";
import { AmountText } from "@/components/shared/amount-text";
import type { NetWorthSummary } from "@/lib/queries/summary";

export function SummaryCards({ summary }: { summary: NetWorthSummary }) {
  const items = [
    {
      label: "Tổng tài sản",
      value: summary.netWorth,
      icon: Wallet,
      color: "#3b82f6",
      wide: true,
    },
    { label: "Khả dụng", value: summary.availableCash, icon: Landmark, color: "#10b981" },
    { label: "Đang cho mượn", value: summary.lending, icon: HandCoins, color: "#f59e0b" },
    { label: "Tổng nợ", value: summary.debt, icon: Receipt, color: "#ef4444" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={`glass flex flex-col gap-2 rounded-3xl p-4 ${
              item.wide ? "col-span-2 lg:col-span-1" : ""
            }`}
            style={{
              backgroundImage: `linear-gradient(135deg, ${item.color}24, transparent 68%)`,
            }}
          >
            <span
              className="flex size-9 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${item.color}26`, color: item.color }}
            >
              <Icon className="size-4.5" />
            </span>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
              <AmountText
                amount={item.value}
                scope="dashboard"
                className="text-lg font-extrabold tabular-nums"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
