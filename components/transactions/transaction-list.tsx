"use client";

import { useMemo } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { ArrowLeftRight, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EntityIcon } from "@/components/shared/entity-icon";
import { AmountText, AmountTextForAccount } from "@/components/shared/amount-text";
import { ACCOUNT_TYPE_META } from "@/components/accounts/account-type";
import { useT } from "@/lib/i18n/use-t";
import type { TFunction } from "i18next";
import type { AmountVisibilityScope } from "@/lib/hooks/use-amount-visibility";
import type { Locale } from "@/lib/i18n";
import type { AccountType } from "@/lib/types/database.types";
import type { TransactionWithRelations } from "@/lib/queries/transactions";

const FALLBACK_ACCOUNT = { type: "cash" as AccountType, unit: null as string | null };

function dayLabel(t: TFunction, locale: Locale, date: string): string {
  const parsed = parseISO(date);
  if (isToday(parsed)) return t("common.today");
  if (isYesterday(parsed)) return t("common.yesterday");
  return format(parsed, "EEEE, dd/MM", { locale: locale === "en" ? enUS : vi });
}

/** Icon + màu của một giao dịch: theo danh mục, hoặc theo nguồn tiền nếu là chuyển khoản. */
function visualsOf(t: TransactionWithRelations) {
  if (t.type === "transfer") {
    return { icon: "ArrowLeftRight", color: "#6366f1" };
  }
  const accountMeta = t.account ? ACCOUNT_TYPE_META[t.account.type as AccountType] : undefined;
  return {
    icon: t.category?.icon ?? accountMeta?.icon ?? null,
    color: t.category?.color ?? accountMeta?.color ?? null,
  };
}

function TransactionRow({
  transaction: t,
  scope,
  showDate,
  onView,
  onEdit,
  onDelete,
}: {
  transaction: TransactionWithRelations;
  scope: AmountVisibilityScope;
  /** Danh sách phẳng không có tiêu đề ngày nên mỗi dòng tự hiện ngày của nó. */
  showDate?: boolean;
  onView?: (transaction: TransactionWithRelations) => void;
  onEdit?: (transaction: TransactionWithRelations) => void;
  onDelete?: (transaction: TransactionWithRelations) => void;
}) {
  const { t: tr, locale } = useT();
  const visuals = visualsOf(t);
  const amountClass =
    t.type === "income" ? "text-income" : t.type === "expense" ? "text-expense" : "text-transfer";
  const sign = t.type === "income" ? "+" : t.type === "expense" ? "-" : "";

  const title =
    t.type === "transfer"
      ? `${t.account?.name ?? "?"} → ${t.to_account?.name ?? "?"}`
      : (t.category?.name ?? tr("common.uncategorized"));

  const subtitle = [
    showDate ? dayLabel(tr, locale, t.transaction_date) : null,
    t.type === "transfer" ? tr("common.transfer") : (t.account?.name || null),
  ]
    .filter(Boolean)
    .join(" · ");

  // Chuyển đổi hiện vật (vd Momo -> vàng) có 2 vế số khác nhau/khác đơn vị.
  const isDualLeg = t.type === "transfer" && t.to_amount != null && t.to_amount !== t.amount;

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-accent/40">
      <button
        type="button"
        onClick={() => onView?.(t)}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
      >
        {t.type === "transfer" ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-transfer/14 text-transfer">
            <ArrowLeftRight className="size-4" />
          </span>
        ) : (
          <EntityIcon icon={visuals.icon} color={visuals.color} className="size-9 rounded-xl" iconClassName="size-4" />
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {subtitle}
            {t.note ? ` · ${t.note}` : ""}
          </p>
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        {isDualLeg ? (
          <span className={`flex flex-col items-end ${amountClass}`}>
            <AmountTextForAccount
              amount={t.amount}
              account={t.account ?? FALLBACK_ACCOUNT}
              scope={scope}
              className="text-[11px] font-semibold opacity-80"
            />
            <AmountTextForAccount
              amount={t.to_amount!}
              account={t.to_account ?? FALLBACK_ACCOUNT}
              scope={scope}
              className="text-sm font-extrabold"
            />
          </span>
        ) : (
          <span className={`flex items-center text-sm font-extrabold tabular-nums ${amountClass}`}>
            {sign}
            <AmountTextForAccount amount={t.amount} account={t.account ?? FALLBACK_ACCOUNT} scope={scope} />
          </span>
        )}
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(t)}>
                  <Pencil className="size-4" />
                  {tr("common.edit")}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(t)}>
                  <Trash2 className="size-4" />
                  {tr("common.delete")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

export function TransactionList({
  transactions,
  scope,
  grouped = true,
  onView,
  onEdit,
  onDelete,
  emptyLabel,
}: {
  transactions: TransactionWithRelations[];
  scope: AmountVisibilityScope;
  /**
   * Gom theo ngày (mặc định) cho các màn hình xem nhiều ngày. Đặt false để hiện danh sách phẳng
   * — dùng ở trang chi tiết nguồn tiền, nơi cuộn vô tận nên tiêu đề ngày sẽ chen giữa các trang.
   */
  grouped?: boolean;
  onView?: (transaction: TransactionWithRelations) => void;
  onEdit?: (transaction: TransactionWithRelations) => void;
  onDelete?: (transaction: TransactionWithRelations) => void;
  emptyLabel?: string;
}) {
  const { t, locale } = useT();
  // Gom theo ngày để danh sách dễ quét mắt hơn một bảng phẳng.
  const groups = useMemo(() => {
    if (!grouped) return [];
    const byDate = new Map<string, TransactionWithRelations[]>();
    for (const t of transactions) {
      const list = byDate.get(t.transaction_date);
      if (list) list.push(t);
      else byDate.set(t.transaction_date, [t]);
    }
    return Array.from(byDate.entries()).map(([date, items]) => ({
      date,
      items,
      total: items.reduce(
        (sum, item) =>
          sum + (item.type === "income" ? item.amount : item.type === "expense" ? -item.amount : 0),
        0,
      ),
    }));
  }, [transactions, grouped]);

  if (transactions.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {emptyLabel ?? t("transactions.list.empty")}
      </p>
    );
  }

  if (!grouped) {
    return (
      <div className="glass overflow-hidden rounded-xl">
        <div className="divide-y divide-border/50 p-1">
          {transactions.map((item) => (
            <TransactionRow
              key={item.id}
              transaction={item}
              scope={scope}
              showDate
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <div key={group.date} className="glass overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">
              {dayLabel(t, locale, group.date)}
            </span>
            <span
              className={`flex items-center text-xs font-bold tabular-nums ${
                group.total >= 0 ? "text-income" : "text-expense"
              }`}
            >
              {group.total >= 0 ? "+" : "-"}
              <AmountText amount={Math.abs(group.total)} scope={scope} />
            </span>
          </div>
          <div className="divide-y divide-border/50 p-1">
            {group.items.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                scope={scope}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
