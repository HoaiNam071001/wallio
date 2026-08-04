"use client";

import { formatAccountAmount, formatCurrency } from "@/lib/utils";
import { useAmountVisibility, type AmountVisibilityScope } from "@/lib/hooks/use-amount-visibility";

const MASK = "••••••";

/** Số tiền dạng VNĐ, tự ẩn thành ••••••  theo trạng thái ẩn/hiện của trang (`scope`). */
export function AmountText({
  amount,
  scope,
  className,
}: {
  amount: number;
  scope: AmountVisibilityScope;
  className?: string;
}) {
  const [visible] = useAmountVisibility(scope);
  return <span className={className}>{visible ? formatCurrency(amount) : MASK}</span>;
}

/** Giống AmountText nhưng dùng đơn vị riêng của nguồn tiền (VNĐ hoặc hiện vật). */
export function AmountTextForAccount({
  amount,
  account,
  scope,
  className,
}: {
  amount: number;
  account: { type: string; unit?: string | null };
  scope: AmountVisibilityScope;
  className?: string;
}) {
  const [visible] = useAmountVisibility(scope);
  return <span className={className}>{visible ? formatAccountAmount(amount, account) : MASK}</span>;
}
