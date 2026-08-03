"use client";

import { useMemo } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeftRight, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EntityIcon } from "@/components/shared/entity-icon";
import { ACCOUNT_TYPE_META } from "@/components/accounts/account-type";
import { formatCurrency } from "@/lib/utils";
import type { AccountType } from "@/lib/types/database.types";
import type { TransactionWithRelations } from "@/lib/queries/transactions";

function dayLabel(date: string): string {
  const parsed = parseISO(date);
  if (isToday(parsed)) return "Hôm nay";
  if (isYesterday(parsed)) return "Hôm qua";
  return format(parsed, "EEEE, dd/MM", { locale: vi });
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
  onEdit,
  onDelete,
}: {
  transaction: TransactionWithRelations;
  onEdit?: (transaction: TransactionWithRelations) => void;
  onDelete?: (transaction: TransactionWithRelations) => void;
}) {
  const visuals = visualsOf(t);
  const amountClass =
    t.type === "income" ? "text-income" : t.type === "expense" ? "text-expense" : "text-transfer";
  const sign = t.type === "income" ? "+" : t.type === "expense" ? "-" : "";

  const title =
    t.type === "transfer"
      ? `${t.account?.name ?? "?"} → ${t.to_account?.name ?? "?"}`
      : (t.category?.name ?? "Không phân loại");

  const subtitle = t.type === "transfer" ? "Chuyển khoản" : (t.account?.name ?? "");

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent/40">
      {t.type === "transfer" ? (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-transfer/14 text-transfer">
          <ArrowLeftRight className="size-5" />
        </span>
      ) : (
        <EntityIcon icon={visuals.icon} color={visuals.color} />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {subtitle}
          {t.note ? ` · ${t.note}` : ""}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span className={`text-sm font-extrabold tabular-nums ${amountClass}`}>
          {sign}
          {formatCurrency(t.amount)}
        </span>
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(t)}>
                  <Pencil className="size-4" />
                  Sửa
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(t)}>
                  <Trash2 className="size-4" />
                  Xoá
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
  onEdit,
  onDelete,
  emptyLabel = "Chưa có khoản nào trong khoảng thời gian này.",
}: {
  transactions: TransactionWithRelations[];
  onEdit?: (transaction: TransactionWithRelations) => void;
  onDelete?: (transaction: TransactionWithRelations) => void;
  emptyLabel?: string;
}) {
  // Gom theo ngày để danh sách dễ quét mắt hơn một bảng phẳng.
  const groups = useMemo(() => {
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
  }, [transactions]);

  if (transactions.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <div key={group.date} className="glass overflow-hidden rounded-3xl">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">
              {dayLabel(group.date)}
            </span>
            <span
              className={`text-xs font-bold tabular-nums ${
                group.total >= 0 ? "text-income" : "text-expense"
              }`}
            >
              {group.total >= 0 ? "+" : "-"}
              {formatCurrency(Math.abs(group.total))}
            </span>
          </div>
          <div className="divide-y divide-border/50 p-1">
            {group.items.map((t) => (
              <TransactionRow key={t.id} transaction={t} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
