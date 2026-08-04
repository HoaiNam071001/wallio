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
import { AmountTextForAccount } from "@/components/shared/amount-text";
import { ACCOUNT_TYPE_META } from "@/components/accounts/account-type";
import { normalizeColor, withAlpha } from "@/lib/theme/palette";
import { useT } from "@/lib/i18n/use-t";
import type { TFunction } from "i18next";
import type { AccountWithBalance } from "@/lib/types/database.types";

/** Quá ngần này ngày không ghi gì thì số dư nhiều khả năng đã lệch thực tế. */
const STALE_AFTER_DAYS = 7;

function activityLabel(t: TFunction, lastDate: string | null): { text: string; stale: boolean } {
  if (!lastDate) return { text: t("accounts.card.noActivity"), stale: true };

  const days = differenceInCalendarDays(new Date(), parseISO(lastDate));
  if (days <= 0) return { text: t("accounts.card.activityToday"), stale: false };
  if (days === 1) return { text: t("accounts.card.activityYesterday"), stale: false };
  return { text: t("accounts.card.activityDaysAgo", { days }), stale: days > STALE_AFTER_DAYS };
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
  const { t } = useT();
  const meta = ACCOUNT_TYPE_META[account.type];
  const color = normalizeColor(account.color ?? meta.color);
  const isDebt = account.type === "debt";
  const displayBalance = isDebt ? Math.abs(account.current_balance) : account.current_balance;
  const activity = activityLabel(t, account.last_activity_date);

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
              {t("accounts.card.adjustBalance")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-4" />
              {t("common.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="size-4" />
              {t("common.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="mt-3 truncate font-bold">{account.name}</p>
      <p className="text-xs font-medium" style={{ color }}>
        {t(`accountType.${account.type}.label`)}
      </p>

      <p className={`mt-2 flex items-center text-xl font-extrabold tabular-nums ${isDebt ? "text-expense" : ""}`}>
        {isDebt && displayBalance !== 0 ? "-" : ""}
        <AmountTextForAccount amount={displayBalance} account={account} scope="accounts" />
      </p>

      {/* Nhắc cân đối khi lâu ngày không ghi — số dư lúc đó dễ lệch thực tế */}
      {activity.stale ? (
        <button
          type="button"
          onClick={onAdjust}
          className="mt-2 flex w-full items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-[11px] font-bold text-amber-700 transition-transform active:scale-95 dark:text-amber-300"
        >
          <Scale className="size-3.5 shrink-0" />
          <span className="truncate">{t("accounts.card.rebalanceSuffix", { text: activity.text })}</span>
        </button>
      ) : (
        <p className="mt-2 text-[11px] font-medium text-muted-foreground">{activity.text}</p>
      )}
    </div>
  );
}
