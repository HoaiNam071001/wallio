"use client";

import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACCOUNT_TYPE_LABELS } from "@/components/accounts/account-type";
import { formatCurrency } from "@/lib/utils";
import type { AccountBalance } from "@/lib/types/database.types";

export function AccountCard({
  account,
  onEdit,
  onDelete,
}: {
  account: AccountBalance;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isDebt = account.type === "debt";
  const displayBalance = isDebt ? Math.abs(account.current_balance) : account.current_balance;

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{account.name}</span>
            <Badge variant="outline">{ACCOUNT_TYPE_LABELS[account.type]}</Badge>
          </div>
          <span
            className={
              isDebt
                ? "text-lg font-semibold text-expense"
                : "text-lg font-semibold"
            }
          >
            {isDebt ? "-" : ""}
            {formatCurrency(displayBalance)}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
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
      </CardContent>
    </Card>
  );
}
