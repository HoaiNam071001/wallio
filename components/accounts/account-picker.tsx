"use client";

import { OptionGrid } from "@/components/shared/option-grid";
import { ACCOUNT_TYPE_META } from "@/components/accounts/account-type";
import { useAccountsWithBalance } from "@/lib/hooks/use-accounts";
import { useT } from "@/lib/i18n/use-t";
import type { AccountType } from "@/lib/types/database.types";

/**
 * Chọn nguồn tiền bằng lưới ô nhỏ (giống lưới danh mục) thay cho dropdown — nhìn thấy hết
 * lựa chọn ngay, chạm một lần là xong, hợp với form nhập nhanh trên mobile.
 */
export function AccountPicker({
  value,
  onChange,
  excludeId,
  excludeTypes,
}: {
  value?: string;
  onChange: (id: string) => void;
  excludeId?: string;
  /** Ẩn bớt các loại nguồn tiền không phù hợp — vd "Hiện vật" chỉ dùng cho chuyển khoản. */
  excludeTypes?: AccountType[];
}) {
  const { t } = useT();
  const { data: accounts } = useAccountsWithBalance();
  const options = (accounts ?? []).filter(
    (a) => a.id !== excludeId && !excludeTypes?.includes(a.type),
  );

  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("accounts.picker.empty")}</p>;
  }

  return (
    <OptionGrid
      items={options.map((account) => {
        const meta = ACCOUNT_TYPE_META[account.type];
        return {
          id: account.id,
          label: account.name,
          icon: account.icon ?? meta.icon,
          color: account.color ?? meta.color,
        };
      })}
      value={value}
      // Nguồn tiền là bắt buộc nên bỏ qua thao tác bỏ chọn (OptionGrid trả về undefined).
      onSelect={(id) => id && onChange(id)}
    />
  );
}
