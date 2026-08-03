import type { AccountType } from "@/lib/types/database.types";
import type { IconName } from "@/lib/theme/icons";

export interface AccountTypeMeta {
  label: string;
  /** Icon + màu mặc định khi người dùng chưa tự chọn. */
  icon: IconName;
  color: string;
  hint: string;
}

export const ACCOUNT_TYPE_META: Record<AccountType, AccountTypeMeta> = {
  cash: { label: "Tiền mặt", icon: "Banknote", color: "#22c55e", hint: "Tiền trong ví" },
  ewallet: { label: "Ví điện tử", icon: "Smartphone", color: "#ec4899", hint: "Momo, ShopeePay..." },
  bank: { label: "Ngân hàng", icon: "Landmark", color: "#3b82f6", hint: "Tài khoản ngân hàng" },
  lending: { label: "Cho mượn", icon: "HandCoins", color: "#f59e0b", hint: "Tiền đang cho mượn" },
  debt: { label: "Khoản nợ", icon: "Receipt", color: "#ef4444", hint: "Tiền đang nợ" },
  other: { label: "Khác", icon: "Wallet", color: "#64748b", hint: "Loại khác" },
};

export const ACCOUNT_TYPE_LABELS = Object.fromEntries(
  Object.entries(ACCOUNT_TYPE_META).map(([value, meta]) => [value, meta.label]),
) as Record<AccountType, string>;

export const ACCOUNT_TYPE_OPTIONS = (Object.keys(ACCOUNT_TYPE_META) as AccountType[]).map(
  (value) => ({ value, ...ACCOUNT_TYPE_META[value] }),
);
