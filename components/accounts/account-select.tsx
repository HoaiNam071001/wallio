"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EntityIcon } from "@/components/shared/entity-icon";
import { ACCOUNT_TYPE_META } from "@/components/accounts/account-type";
import { useAccountsWithBalance } from "@/lib/hooks/use-accounts";
import { formatCurrency } from "@/lib/utils";

/** Ô chọn nguồn tiền: icon + tên + số dư hiện tại, dùng chung cho form giao dịch. */
export function AccountSelect({
  value,
  onChange,
  placeholder = "Chọn nguồn tiền",
  excludeId,
}: {
  value?: string;
  onChange: (id: string) => void;
  placeholder?: string;
  excludeId?: string;
}) {
  const { data: accounts } = useAccountsWithBalance();
  const options = (accounts ?? []).filter((a) => a.id !== excludeId);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((account) => {
          const meta = ACCOUNT_TYPE_META[account.type];
          return (
            <SelectItem key={account.id} value={account.id}>
              <EntityIcon
                icon={account.icon ?? meta.icon}
                color={account.color ?? meta.color}
                className="size-8 rounded-xl"
                iconClassName="size-4"
              />
              <span className="min-w-0 flex-1 truncate">{account.name}</span>
              <span className="shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">
                {formatCurrency(account.current_balance)}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
