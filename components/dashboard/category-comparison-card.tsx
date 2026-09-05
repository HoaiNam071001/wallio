"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityIcon } from "@/components/shared/entity-icon";
import { AmountText } from "@/components/shared/amount-text";
import { useCategoryComparison } from "@/lib/hooks/use-summary";
import { useAmountVisibility } from "@/lib/hooks/use-amount-visibility";
import { colorForKey } from "@/lib/theme/palette";
import { formatCurrency } from "@/lib/utils";
import { useT } from "@/lib/i18n/use-t";
import type { CategoryComparisonItem } from "@/lib/queries/summary";

export type ComparisonMode = "previousPeriod" | "sameLastYear";

const TREND_STYLE: Record<CategoryComparisonItem["trend"], { icon: typeof ArrowUpRight; className: string }> = {
  up: { icon: ArrowUpRight, className: "text-income" },
  down: { icon: ArrowDownRight, className: "text-expense" },
  flat: { icon: Minus, className: "text-muted-foreground" },
};

/**
 * So sánh danh mục giữa kỳ hiện tại và một kỳ so sánh (kỳ trước / cùng kỳ năm trước). Màu xu hướng
 * theo hướng thay đổi (tăng = xanh, giảm = đỏ), không đảo theo income/expense — quy ước đã chốt với
 * người dùng, mũi tên tăng/giảm giống quy ước giá cổ phiếu quen thuộc hơn là "tốt/xấu cho ví".
 */
export function CategoryComparisonCard({
  currentStart,
  currentEnd,
  previousStart,
  previousEnd,
  kind,
  mode,
  onModeChange,
}: {
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
  kind: "income" | "expense";
  mode: ComparisonMode;
  onModeChange: (mode: ComparisonMode) => void;
}) {
  const { t } = useT();
  const [visible] = useAmountVisibility("reports");
  const { data } = useCategoryComparison(currentStart, currentEnd, previousStart, previousEnd, kind);
  const items = data ?? [];

  return (
    <Card>
      <CardHeader className="flex-col items-start gap-2">
        <CardTitle className="text-base">{t("reports.comparison.title")}</CardTitle>
        <Tabs value={mode} onValueChange={(v) => onModeChange(v as ComparisonMode)}>
          <TabsList className="h-9 w-full">
            <TabsTrigger value="previousPeriod" className="text-xs">
              {t("reports.comparison.modePrevious")}
            </TabsTrigger>
            <TabsTrigger value="sameLastYear" className="text-xs">
              {t("reports.comparison.modeSameYear")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("reports.comparison.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((item) => {
              const key = item.categoryId ?? "uncategorized";
              const color = colorForKey(key, item.color);
              const trend = TREND_STYLE[item.trend];
              const TrendIcon = trend.icon;
              return (
                <li key={key} className="flex items-center gap-2.5">
                  <EntityIcon icon={item.icon} color={color} className="size-9 rounded-xl" iconClassName="size-4" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.categoryName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {visible ? formatCurrency(item.previousTotal) : "••••••"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <AmountText amount={item.currentTotal} scope="reports" className="text-sm font-bold tabular-nums" />
                    {item.changePercent === null ? (
                      <span className="text-xs font-semibold text-brand-600">{t("reports.comparison.new")}</span>
                    ) : (
                      <span className={`flex items-center gap-0.5 text-xs font-semibold tabular-nums ${trend.className}`}>
                        <TrendIcon className="size-3.5" />
                        {Math.abs(item.changePercent).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
