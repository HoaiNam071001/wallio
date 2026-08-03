import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { NetWorthSummary } from "@/lib/queries/summary";

export function SummaryCards({ summary }: { summary: NetWorthSummary }) {
  const items = [
    { label: "Tổng tài sản", value: summary.netWorth, className: "" },
    { label: "Khả dụng", value: summary.availableCash, className: "" },
    { label: "Đang cho mượn", value: summary.lending, className: "text-transfer" },
    { label: "Tổng nợ", value: summary.debt, className: "text-expense" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex flex-col gap-1">
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className={`text-xl ${item.className}`}>
              {formatCurrency(item.value)}
            </CardTitle>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
