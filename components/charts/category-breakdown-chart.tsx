"use client";

import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EntityIcon } from "@/components/shared/entity-icon";
import { AmountText } from "@/components/shared/amount-text";
import { useAmountVisibility, type AmountVisibilityScope } from "@/lib/hooks/use-amount-visibility";
import { formatCurrency } from "@/lib/utils";
import { colorForKey } from "@/lib/theme/palette";
import { useT } from "@/lib/i18n/use-t";
import type { CategoryBreakdownItem } from "@/lib/queries/summary";

interface Slice extends CategoryBreakdownItem {
  key: string;
  fill: string;
  percent: number;
}

function TooltipCard({ slice, visible }: { slice: Slice; visible: boolean }) {
  return (
    <div className="glass rounded-2xl px-3 py-2 text-xs">
      <p className="font-bold">{slice.categoryName}</p>
      <p className="text-muted-foreground">
        {visible ? formatCurrency(slice.total) : "••••••"} · {slice.percent.toFixed(1)}%
      </p>
    </div>
  );
}

function BreakdownList({ slices, scope }: { slices: Slice[]; scope: AmountVisibilityScope }) {
  return (
    <ul className="hide-scrollbar flex max-h-72 min-w-0 flex-col gap-1.5 overflow-y-auto">
      {slices.map((slice) => (
        <li key={slice.key} className="flex items-center gap-2.5">
          <EntityIcon icon={slice.icon} color={slice.fill} className="size-8 rounded-xl" iconClassName="size-4" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{slice.categoryName}</span>
          <AmountText
            amount={slice.total}
            scope={scope}
            className="shrink-0 text-right text-sm font-bold tabular-nums"
          />
          <span className="w-11 shrink-0 text-right text-xs font-semibold text-muted-foreground tabular-nums">
            {slice.percent.toFixed(0)}%
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Donut phần trăm theo danh mục. Màu bám theo danh mục (do người dùng chọn),
 * không theo thứ hạng — lọc bớt mục không làm đổi màu các mục còn lại.
 */
export function CategoryBreakdownChart({
  data,
  scope,
  emptyLabel,
  variant = "pie",
}: {
  data: CategoryBreakdownItem[];
  scope: AmountVisibilityScope;
  emptyLabel?: string;
  /** "bar" = danh sách thanh ngang; "flat" = 1 thanh dẹt chia màu theo tỉ lệ, bấm mở modal chi tiết; "pie" là donut cũ. */
  variant?: "pie" | "bar" | "flat";
}) {
  const { t } = useT();
  const [visible] = useAmountVisibility(scope);
  const [detailOpen, setDetailOpen] = useState(false);
  const { slices, total } = useMemo(() => {
    const sum = data.reduce((acc, item) => acc + item.total, 0);
    const sorted = [...data].sort((a, b) => b.total - a.total);
    return {
      total: sum,
      slices: sorted.map<Slice>((item) => {
        const key = item.categoryId ?? "uncategorized";
        return {
          ...item,
          key,
          fill: colorForKey(key, item.color),
          percent: sum > 0 ? (item.total / sum) * 100 : 0,
        };
      }),
    };
  }, [data]);

  if (slices.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {emptyLabel ?? t("charts.categoryBreakdown.empty")}
      </p>
    );
  }

  if (variant === "flat") {
    return (
      <>
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="flex w-full flex-col items-center gap-2 rounded-2xl py-1 transition-opacity active:opacity-70"
        >
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            {slices.map((slice) => (
              <div
                key={slice.key}
                style={{ width: `${slice.percent}%`, backgroundColor: slice.fill }}
                className="h-full first:rounded-l-full last:rounded-r-full"
              />
            ))}
          </div>
          <AmountText
            amount={total}
            scope={scope}
            className="text-lg font-extrabold tabular-nums"
          />
        </button>

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("charts.categoryBreakdown.total")}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <BreakdownList slices={slices} scope={scope} />
            </DialogBody>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (variant === "bar") {
    return (
      <ul className="flex flex-col gap-3">
        {slices.map((slice) => (
          <li key={slice.key} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <EntityIcon
                icon={slice.icon}
                color={slice.fill}
                className="size-8 rounded-xl"
                iconClassName="size-4"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {slice.categoryName}
              </span>
              <AmountText
                amount={slice.total}
                scope={scope}
                className="shrink-0 text-sm font-bold tabular-nums"
              />
              <span className="w-10 shrink-0 text-right text-xs font-semibold text-muted-foreground tabular-nums">
                {slice.percent.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${slice.percent}%`, backgroundColor: slice.fill }}
              />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative mx-auto size-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="total"
              nameKey="categoryName"
              innerRadius="64%"
              outerRadius="98%"
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((slice) => (
                <Cell key={slice.key} fill={slice.fill} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <TooltipCard slice={payload[0].payload as Slice} visible={visible} />
                ) : null
              }
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Số tổng đặt giữa donut */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-semibold text-muted-foreground">{t("charts.categoryBreakdown.total")}</span>
          <AmountText
            amount={total}
            scope={scope}
            className="px-6 text-center text-sm leading-tight font-extrabold tabular-nums"
          />
        </div>
      </div>

      {/* Chú giải kiêm bảng số liệu */}
      <BreakdownList slices={slices} scope={scope} />
    </div>
  );
}
