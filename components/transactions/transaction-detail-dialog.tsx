"use client";

import { format, parseISO } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { ArrowLeftRight, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EntityIcon } from "@/components/shared/entity-icon";
import { AmountTextForAccount } from "@/components/shared/amount-text";
import { ACCOUNT_TYPE_META } from "@/components/accounts/account-type";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { AmountVisibilityScope } from "@/lib/hooks/use-amount-visibility";
import type { AccountType } from "@/lib/types/database.types";
import type { TransactionWithRelations } from "@/lib/queries/transactions";

const FALLBACK_ACCOUNT = { type: "cash" as AccountType, unit: null as string | null };

/** Xem chi tiết một khoản đã ghi. Sửa/Xoá là tuỳ chọn — Dashboard chỉ xem, Sổ thu chi có đủ cả hai. */
export function TransactionDetailDialog({
  transaction: t,
  scope,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  editHref,
}: {
  transaction: TransactionWithRelations | null;
  scope: AmountVisibilityScope;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Dùng khi màn hình hiện tại không có sẵn form sửa (vd Dashboard) — điều hướng sang nơi có. */
  editHref?: string;
}) {
  const { t: tr, locale } = useTranslation();
  if (!t) return null;

  const isTransfer = t.type === "transfer";
  const isDualLeg = isTransfer && t.to_amount != null && t.to_amount !== t.amount;
  const amountClass =
    t.type === "income" ? "text-income" : t.type === "expense" ? "text-expense" : "text-transfer";
  const accountMeta = t.account ? ACCOUNT_TYPE_META[t.account.type as AccountType] : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tr.transactions.detail.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-1 py-2 text-center">
          {isTransfer ? (
            <span className="flex size-14 items-center justify-center rounded-3xl bg-transfer/14 text-transfer">
              <ArrowLeftRight className="size-6" />
            </span>
          ) : (
            <EntityIcon
              icon={t.category?.icon ?? accountMeta?.icon ?? null}
              color={t.category?.color ?? accountMeta?.color ?? null}
              className="size-14"
              iconClassName="size-6"
            />
          )}
          <p className="mt-2 text-lg font-extrabold">
            {isTransfer ? tr.common.transfer : (t.category?.name ?? tr.common.uncategorized)}
          </p>

          {isDualLeg ? (
            <div className={`flex flex-col items-center gap-0.5 ${amountClass}`}>
              <AmountTextForAccount
                amount={t.amount}
                account={t.account ?? FALLBACK_ACCOUNT}
                scope={scope}
                className="text-base font-bold opacity-80"
              />
              <AmountTextForAccount
                amount={t.to_amount!}
                account={t.to_account ?? FALLBACK_ACCOUNT}
                scope={scope}
                className="text-2xl font-extrabold"
              />
            </div>
          ) : (
            <span className={`flex items-center text-2xl font-extrabold tabular-nums ${amountClass}`}>
              {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""}
              <AmountTextForAccount amount={t.amount} account={t.account ?? FALLBACK_ACCOUNT} scope={scope} />
            </span>
          )}
        </div>

        <dl className="flex flex-col gap-2 rounded-2xl bg-muted/50 p-4 text-sm">
          <Row
            label={tr.transactions.detail.date}
            value={format(parseISO(t.transaction_date), "EEEE, dd/MM/yyyy", {
              locale: locale === "en" ? enUS : vi,
            })}
          />
          {isTransfer ? (
            <>
              <Row label={tr.transactions.detail.fromAccount} value={t.account?.name ?? "—"} />
              <Row label={tr.transactions.detail.toAccount} value={t.to_account?.name ?? "—"} />
            </>
          ) : (
            <Row label={tr.transactions.detail.account} value={t.account?.name ?? "—"} />
          )}
          {t.note && <Row label={tr.transactions.detail.note} value={t.note} />}
        </dl>

        {(onEdit || onDelete || editHref) && (
          <div className="flex gap-2">
            {editHref && (
              <Button variant="outline" className="flex-1" asChild>
                <Link href={editHref}>
                  <Pencil className="size-4" />
                  {tr.transactions.detail.editInTransactions}
                </Link>
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" className="flex-1" onClick={onEdit}>
                <Pencil className="size-4" />
                {tr.common.edit}
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" className="flex-1" onClick={onDelete}>
                <Trash2 className="size-4" />
                {tr.common.delete}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate text-right font-semibold">{value}</dd>
    </div>
  );
}
