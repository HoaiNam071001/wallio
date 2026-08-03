"use client";

import { format, parseISO } from "date-fns";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import type { TransactionWithRelations } from "@/lib/queries/transactions";

const TYPE_BADGE_VARIANT = {
  income: "income",
  expense: "expense",
  transfer: "transfer",
} as const;

const TYPE_LABEL = {
  income: "Thu",
  expense: "Chi",
  transfer: "Chuyển khoản",
} as const;

function AmountLabel({ transaction }: { transaction: TransactionWithRelations }) {
  if (transaction.type === "income") {
    return <span className="font-semibold text-income">+{formatCurrency(transaction.amount)}</span>;
  }
  if (transaction.type === "expense") {
    return <span className="font-semibold text-expense">-{formatCurrency(transaction.amount)}</span>;
  }
  return <span className="font-semibold text-transfer">{formatCurrency(transaction.amount)}</span>;
}

export function TransactionList({
  transactions,
  onEdit,
  onDelete,
}: {
  transactions: TransactionWithRelations[];
  onEdit?: (transaction: TransactionWithRelations) => void;
  onDelete?: (transaction: TransactionWithRelations) => void;
}) {
  if (transactions.length === 0) {
    return <p className="text-muted-foreground">Không có giao dịch nào trong khoảng thời gian này.</p>;
  }

  return (
    <div className="flex flex-col divide-y rounded-lg border">
      {transactions.map((t) => (
        <div key={t.id} className="flex items-center justify-between gap-3 p-3">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={TYPE_BADGE_VARIANT[t.type]}>{TYPE_LABEL[t.type]}</Badge>
              <span className="text-sm text-muted-foreground">
                {format(parseISO(t.transaction_date), "dd/MM/yyyy")}
              </span>
            </div>
            <span className="truncate text-sm">
              {t.type === "transfer"
                ? `${t.account?.name ?? "?"} → ${t.to_account?.name ?? "?"}`
                : `${t.account?.name ?? "?"}${t.category ? " · " + t.category.name : ""}`}
            </span>
            {t.note && <span className="truncate text-xs text-muted-foreground">{t.note}</span>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <AmountLabel transaction={t} />
            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
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
      ))}
    </div>
  );
}
