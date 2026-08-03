"use client";

import { differenceInCalendarDays, parseISO } from "date-fns";
import { MoreVertical, Pencil, Scale, Trash2 } from "lucide-react";
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
import { normalizeColor, withAlpha } from "@/lib/theme/palette";
import type { AccountWithBalance } from "@/lib/types/database.types";

/** Quá ngần này ngày không ghi gì thì số dư nhiều khả năng đã lệch thực tế. */
const STALE_AFTER_DAYS = 7;

function activityLabel(lastDate: string | null): { text: string; stale: boolean } {
  if (!lastDate) return { text: "Chưa có giao dịch nào", stale: true };

  const days = differenceInCalendarDays(new Date(), parseISO(lastDate));
  if (days <= 0) return { text: "Ghi hôm nay", stale: false };
  if (days === 1) return { text: "Ghi hôm qua", stale: false };
  return { text: `Ghi lần cuối ${days} ngày trước`, stale: days > STALE_AFTER_DAYS };
}

export function AccountCard({
  account,
  onEdit,
  onDelete,
  onAdjust,
}: {
  account: AccountWithBalance;
  onEdit: () => void;
  onDelete: () => void;
  onAdjust: () => void;
}) {
  const meta = ACCOUNT_TYPE_META[account.type];
  const color = normalizeColor(account.color ?? meta.color);
  const isDebt = account.type === "debt";
  const displayBalance = isDebt ? Math.abs(account.current_balance) : account.current_balance;
  const activity = activityLabel(account.last_activity_date);

  return (
    <div
      className="glass relative overflow-hidden rounded-3xl p-4"
      style={{ backgroundImage: `linear-gradient(135deg, ${withAlpha(color, 0.16)}, transparent 65%)` }}
    >
      <div className="flex items-start justify-between gap-2">
        <EntityIcon
          icon={account.icon ?? meta.icon}
          color={color}
          className="size-12"
          iconClassName="size-6"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="-mt-1 -mr-1 size-8">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onAdjust}>
              <Scale className="size-4" />
              Cân đối số dư
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-4" />
              Sửa
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="size-4" />
              Xoá
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="mt-3 truncate font-bold">{account.name}</p>
      <p className="text-xs font-medium" style={{ color }}>
        {meta.label}
      </p>

      <p className={`mt-2 text-xl font-extrabold tabular-nums ${isDebt ? "text-expense" : ""}`}>
        {isDebt && displayBalance !== 0 ? "-" : ""}
        {formatCurrency(displayBalance)}
      </p>

      {/* Nhắc cân đối khi lâu ngày không ghi — số dư lúc đó dễ lệch thực tế */}
      {activity.stale ? (
        <button
          type="button"
          onClick={onAdjust}
          className="mt-2 flex w-full items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-[11px] font-bold text-amber-700 transition-transform active:scale-95 dark:text-amber-300"
        >
          <Scale className="size-3.5 shrink-0" />
          <span className="truncate">{activity.text} · cân đối lại</span>
        </button>
      ) : (
        <p className="mt-2 text-[11px] font-medium text-muted-foreground">{activity.text}</p>
      )}
    </div>
  );
}
