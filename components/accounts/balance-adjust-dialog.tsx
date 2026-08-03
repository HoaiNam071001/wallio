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
              ? "Số dư đã khớp, không cần điều chỉnh"
              : `Đã cân đối ${formatCurrency(Math.abs(result.difference))}`,
          );
          onDone();
        },
        onError: () => toast.error("Có lỗi xảy ra, thử lại sau"),
      },
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Scale className="size-5 text-brand-600" />
          Cân đối số dư
        </DialogTitle>
        <DialogDescription>
          Nhập số tiền thực tế đang có. Wallio sẽ ghi một khoản chênh lệch vào ngày bạn chọn, các
          giao dịch cũ vẫn giữ nguyên.
        </DialogDescription>
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
          <p className="text-xs text-muted-foreground">{meta.label}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Cân đối vào ngày</Label>
        <DateField value={date} onChange={setDate} max={format(new Date(), "yyyy-MM-dd")} />
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3">
        <span className="text-sm font-semibold text-muted-foreground">Wallio đang tính</span>
        <span className="text-sm font-extrabold tabular-nums">
          {isLoading || expected === undefined ? "..." : formatCurrency(expected)}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="actual">Số tiền thực tế</Label>
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
            ? "Khớp rồi — không cần ghi thêm gì"
            : difference > 0
              ? `Ghi thêm khoản thu ${formatCurrency(difference)}`
              : `Ghi thêm khoản chi ${formatCurrency(Math.abs(difference))}`}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="adjust-note">Ghi chú</Label>
        <Input
          id="adjust-note"
          placeholder="VD: quên ghi mấy khoản ăn sáng"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>

      <Button
        size="lg"
        onClick={handleSubmit}
        disabled={adjust.isPending || actual === undefined || isLoading}
      >
        {adjust.isPending ? "Đang lưu..." : "Cân đối"}
      </Button>
    </>
  );
}
