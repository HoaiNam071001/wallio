"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EntityIcon } from "@/components/shared/entity-icon";
import { AmountTextForAccount } from "@/components/shared/amount-text";
import { ACCOUNT_TYPE_META } from "@/components/accounts/account-type";
import { useAccountsWithBalance } from "@/lib/hooks/use-accounts";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { AccountType } from "@/lib/types/database.types";

/** Ô chọn nguồn tiền: icon + tên + số dư hiện tại, dùng chung cho form giao dịch. */
export function AccountSelect({
  value,
  onChange,
  placeholder,
  excludeId,
  excludeTypes,
}: {
  value?: string;
  onChange: (id: string) => void;
  placeholder?: string;
  excludeId?: string;
  /** Ẩn bớt các loại nguồn tiền không phù hợp — vd "Hiện vật" chỉ dùng cho chuyển khoản. */
  excludeTypes?: AccountType[];
}) {
  const { t } = useTranslation();
  const { data: accounts } = useAccountsWithBalance();
  const options = (accounts ?? []).filter(
    (a) => a.id !== excludeId && !excludeTypes?.includes(a.type),
  );

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder ?? t.accounts.select.defaultPlaceholder} />
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
              {/* <AmountTextForAccount
                amount={account.current_balance}
                account={account}
                scope="transactions"
                className="shrink-0 text-xs font-semibold text-muted-foreground tabular-nums"
              /> */}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
