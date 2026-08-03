import type { AccountType } from "@/lib/types/database.types";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: "Tiền mặt",
  ewallet: "Ví điện tử",
  bank: "Ngân hàng",
  lending: "Cho mượn",
  debt: "Khoản nợ",
  other: "Khác",
};

export const ACCOUNT_TYPE_OPTIONS = Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => ({
  value: value as AccountType,
  label,
}));
