"use client";

import { EntityIcon } from "@/components/shared/entity-icon";
import { ACCOUNT_TYPE_META } from "@/components/accounts/account-type";
import { formatCurrency } from "@/lib/utils";
import { colorForKey } from "@/lib/theme/palette";
import type { AccountBreakdownItem } from "@/lib/queries/summary";
import type { AccountType } from "@/lib/types/database.types";

/** Thanh ngang so sánh số dư từng nguồn tiền, mỗi nguồn giữ đúng màu của nó. */
export function AccountBreakdownChart({ data }: { data: AccountBreakdownItem[] }) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Chưa có nguồn tiền nào.</p>;
  }

  const max = Math.max(...data.map((item) => Math.abs(item.balance)), 1);

  return (
    <ul className="flex flex-col gap-3">
      {data.map((item) => {
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
              <span className="shrink-0 text-sm font-bold tabular-nums">
                {formatCurrency(item.balance)}
              </span>
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
