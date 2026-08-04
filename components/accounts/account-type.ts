import type { TFunction } from "i18next";
import type { AccountType } from "@/lib/types/database.types";
import type { IconName } from "@/lib/theme/icons";

export interface AccountTypeMeta {
  /** Icon + màu mặc định khi người dùng chưa tự chọn. */
  icon: IconName;
  color: string;
}

/** Không chứa label/hint — lấy từ t.accountType[type] vì cần theo ngôn ngữ đang chọn. */
export const ACCOUNT_TYPE_META: Record<AccountType, AccountTypeMeta> = {
  cash: { icon: "Banknote", color: "#22c55e" },
  ewallet: { icon: "Smartphone", color: "#ec4899" },
  bank: { icon: "Landmark", color: "#3b82f6" },
  lending: { icon: "HandCoins", color: "#f59e0b" },
  debt: { icon: "Receipt", color: "#ef4444" },
  in_kind: { icon: "Coins", color: "#eab308" },
  other: { icon: "Wallet", color: "#64748b" },
};

export function accountTypeOptions(t: TFunction) {
  return (Object.keys(ACCOUNT_TYPE_META) as AccountType[]).map((value) => ({
    value,
    ...ACCOUNT_TYPE_META[value],
    ...(t(`accountType.${value}`, { returnObjects: true }) as { label: string; hint: string }),
  }));
}
