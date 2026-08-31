"use client";

import Link from "next/link";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { MoreVertical, Pencil, Scale, Star, StarOff, Trash2 } from "lucide-react";
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
import { ROUTES } from "@/lib/constants/routes";
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
  onToggleDefault,
}: {
  account: AccountWithBalance;
  onEdit: () => void;
  onDelete: () => void;
  onAdjust: () => void;
  onToggleDefault: () => void;
}) {
  const { t } = useT();
  const meta = ACCOUNT_TYPE_META[account.type];
  const color = normalizeColor(account.color ?? meta.color);
  const isDebt = account.type === "debt";
  const displayBalance = isDebt ? Math.abs(account.current_balance) : account.current_balance;
  const activity = activityLabel(t, account.last_activity_date);

  return (
    <div
      className="glass relative overflow-hidden rounded-xl p-4"
      style={{ backgroundImage: `linear-gradient(135deg, ${withAlpha(color, 0.16)}, transparent 65%)` }}
    >
      {/* Lớp phủ toàn thẻ để bấm đâu cũng mở chi tiết; các nút bên dưới nổi lên trên nhờ z-2. */}
      <Link
        href={ROUTES.accountDetail(account.id)}
        aria-label={account.name}
        className="absolute inset-0 z-1"
      />

      <div className="flex items-start justify-between gap-2">
        <EntityIcon
          icon={account.icon ?? meta.icon}
          color={color}
          className="size-12"
          iconClassName="size-6"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative z-2 -mt-1 -mr-1 size-8">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onToggleDefault}>
              {account.is_default ? <StarOff className="size-4" /> : <Star className="size-4" />}
              {account.is_default ? t("accounts.card.unsetDefault") : t("accounts.card.setDefault")}
            </DropdownMenuItem>
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
      <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color }}>
        <span className="truncate">{t(`accountType.${account.type}.label`)}</span>
        {account.is_default && (
          <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 dark:text-brand-300">
            <Star className="size-2.5 fill-current" />
            {t("common.defaultBadge")}
          </span>
        )}
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
          className="relative z-2 mt-2 flex w-full items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-[11px] font-bold text-amber-700 transition-transform active:scale-95 dark:text-amber-300"
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
