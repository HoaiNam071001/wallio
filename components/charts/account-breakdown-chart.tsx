"use client";

import { EntityIcon } from "@/components/shared/entity-icon";
import { AmountText } from "@/components/shared/amount-text";
import { ACCOUNT_TYPE_META } from "@/components/accounts/account-type";
import { colorForKey } from "@/lib/theme/palette";
import type { AmountVisibilityScope } from "@/lib/hooks/use-amount-visibility";
import type { AccountBreakdownItem } from "@/lib/queries/summary";
import type { AccountType } from "@/lib/types/database.types";

/** Thanh ngang so sánh số dư từng nguồn tiền, mỗi nguồn giữ đúng màu của nó. */
export function AccountBreakdownChart({
  data,
  scope,
}: {
  data: AccountBreakdownItem[];
  scope: AmountVisibilityScope;
}) {
  // Hiện vật không có giá VNĐ cố định nên không so được cùng thang với các nguồn còn lại —
  // hiển thị riêng ở mục "Hiện vật" trên Dashboard thay vì gộp vào đây.
  const vndData = data.filter((item) => item.type !== "in_kind");

  if (vndData.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Chưa có nguồn tiền nào.</p>;
  }

  const max = Math.max(...vndData.map((item) => Math.abs(item.balance)), 1);

  return (
    <ul className="flex flex-col gap-3">
      {vndData.map((item) => {
        const meta = ACCOUNT_TYPE_META[item.type as AccountType] ?? ACCOUNT_TYPE_META.other;
        const color = colorForKey(item.accountId, item.color ?? meta.color);
        const width = (Math.abs(item.balance) / max) * 100;

        return (
          <li key={item.accountId} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <EntityIcon
                icon={item.icon ?? meta.icon}
                color={color}
                className="size-8 rounded-xl"
                iconClassName="size-4"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {item.accountName}
              </span>
              <AmountText
                amount={item.balance}
                scope={scope}
                className="shrink-0 text-sm font-bold tabular-nums"
              />
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${width}%`, backgroundColor: color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
