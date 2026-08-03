"use client";

import { MoreVertical, Pencil, Trash2 } from "lucide-react";
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

export function AccountCard({
  account,
  onEdit,
  onDelete,
}: {
  account: AccountWithBalance;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = ACCOUNT_TYPE_META[account.type];
  const color = normalizeColor(account.color ?? meta.color);
  const isDebt = account.type === "debt";
  const displayBalance = isDebt ? Math.abs(account.current_balance) : account.current_balance;

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

      <p
        className={`mt-2 text-xl font-extrabold tabular-nums ${isDebt ? "text-expense" : ""}`}
      >
        {isDebt && displayBalance !== 0 ? "-" : ""}
        {formatCurrency(displayBalance)}
      </p>
    </div>
  );
}
