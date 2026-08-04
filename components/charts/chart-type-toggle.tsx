"use client";

import { BarChart3, PieChart, StretchHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/use-t";
import type { ChartType } from "@/lib/hooks/use-chart-type";

const OPTIONS: { type: ChartType; icon: LucideIcon; labelKey: string }[] = [
  { type: "flat", icon: StretchHorizontal, labelKey: "charts.typeToggle.flat" },
  { type: "bar", icon: BarChart3, labelKey: "charts.typeToggle.bar" },
  { type: "pie", icon: PieChart, labelKey: "charts.typeToggle.pie" },
];

/** Toggle 3 chế độ chart cho card cơ cấu theo danh mục — dùng chung ở Sổ thu chi và Báo cáo. */
export function ChartTypeToggle({
  value,
  onChange,
}: {
  value: ChartType;
  onChange: (type: ChartType) => void;
}) {
  const { t } = useT();
  return (
    <div className="flex gap-0.5 rounded-full border border-input bg-card/60 p-0.5">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = value === option.type;
        return (
          <button
            key={option.type}
            type="button"
            onClick={() => onChange(option.type)}
            aria-label={t(option.labelKey)}
            className={cn(
              "flex size-7 items-center justify-center rounded-full transition-colors",
              active ? "bg-brand-600 text-white" : "text-muted-foreground",
            )}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
