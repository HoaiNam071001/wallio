"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, Check, Scale } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateField } from "@/components/ui/date-field";
import { EntityIcon } from "@/components/shared/entity-icon";
import { ACCOUNT_TYPE_META } from "@/components/accounts/account-type";
import { useAccountBalanceAsOf, useAdjustBalance } from "@/lib/hooks/use-accounts";
import { useAuth } from "@/lib/hooks/use-auth";
import { useTranslation } from "@/lib/i18n/use-translation";
import { formatCurrency } from "@/lib/utils";
import type { AccountWithBalance } from "@/lib/types/database.types";

/**
 * "Cân đối số dư": người dùng nhập số tiền THỰC TẾ đang có, app tự ghi một bút toán
 * thu/chi bằng đúng phần chênh lệch vào ngày được chọn.
 */
export function BalanceAdjustDialog({
  account,
  open,
  onOpenChange,
}: {
  account: AccountWithBalance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Nội dung được mount lại mỗi lần mở nên state luôn sạch, không cần effect reset */}
        {account && <AdjustForm account={account} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function AdjustForm({
  account,
  onDone,
}: {
  account: AccountWithBalance;
  onDone: () => void;
}) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const adjust = useAdjustBalance();

  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [typedActual, setTypedActual] = useState<number | undefined>(undefined);
  const [note, setNote] = useState("");

  const { data: expected, isLoading } = useAccountBalanceAsOf(account.id, date);

  // Chưa gõ gì thì ô "thực tế" hiển thị luôn số app đang tính (chênh lệch = 0).
  const actual = typedActual ?? expected;
  const difference =
    actual === undefined || expected === undefined ? 0 : Math.round(actual - expected);

  const meta = ACCOUNT_TYPE_META[account.type];

  function handleSubmit() {
    if (!user || actual === undefined) return;
    adjust.mutate(
      { userId: user.id, accountId: account.id, actualBalance: actual, date, note },
      {
        onSuccess: (result) => {
          toast.success(
            result.difference === 0
              ? t.accounts.balanceAdjust.toastMatched
              : t.accounts.balanceAdjust.toastAdjusted(formatCurrency(Math.abs(result.difference))),
          );
          onDone();
        },
        onError: () => toast.error(t.common.genericError),
      },
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Scale className="size-5 text-brand-600" />
          {t.accounts.balanceAdjust.title}
        </DialogTitle>
        <DialogDescription>{t.accounts.balanceAdjust.description}</DialogDescription>
      </DialogHeader>

      <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
        <EntityIcon
          icon={account.icon ?? meta.icon}
          color={account.color ?? meta.color}
          className="size-12"
          iconClassName="size-6"
        />
        <div className="min-w-0">
          <p className="truncate font-bold">{account.name}</p>
          <p className="text-xs text-muted-foreground">{t.accountType[account.type].label}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t.accounts.balanceAdjust.adjustOnDate}</Label>
        <DateField value={date} onChange={setDate} max={format(new Date(), "yyyy-MM-dd")} />
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3">
        <span className="text-sm font-semibold text-muted-foreground">
          {t.accounts.balanceAdjust.calculating}
        </span>
        <span className="text-sm font-extrabold tabular-nums">
          {isLoading || expected === undefined ? "..." : formatCurrency(expected)}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="actual">{t.accounts.balanceAdjust.actualAmount}</Label>
        <CurrencyInput
          id="actual"
          allowNegative
          value={actual}
          onValueChange={setTypedActual}
          className="h-12 text-lg"
        />
      </div>

      {/* Xem trước bút toán sẽ được ghi */}
      <div
        className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 ${
          difference === 0
            ? "bg-muted/60"
            : difference > 0
              ? "bg-income/12 text-income"
              : "bg-expense/12 text-expense"
        }`}
      >
        {difference === 0 ? (
          <Check className="size-4 shrink-0 text-muted-foreground" />
        ) : difference > 0 ? (
          <ArrowDownLeft className="size-4 shrink-0" />
        ) : (
          <ArrowUpRight className="size-4 shrink-0" />
        )}
        <span className="text-sm font-semibold">
          {difference === 0
            ? t.accounts.balanceAdjust.matched
            : difference > 0
              ? t.accounts.balanceAdjust.addIncome(formatCurrency(difference))
              : t.accounts.balanceAdjust.addExpense(formatCurrency(Math.abs(difference)))}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="adjust-note">{t.transactions.form.note}</Label>
        <Input
          id="adjust-note"
          placeholder={t.accounts.balanceAdjust.notePlaceholder}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>

      <Button
        size="lg"
        onClick={handleSubmit}
        disabled={adjust.isPending || actual === undefined || isLoading}
      >
        {adjust.isPending ? t.common.saving : t.accounts.balanceAdjust.submit}
      </Button>
    </>
  );
}
