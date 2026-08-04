/** Ký hiệu mặc định của từng đơn vị tiền — tên hiển thị lấy từ i18n (`currency.<code>.name`). */
export interface CurrencyMeta {
  code: string;
  symbol: string;
}

export const DEFAULT_CURRENCY_CODE = "VND";

export const CURRENCIES: CurrencyMeta[] = [
  { code: "VND", symbol: "₫" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "JPY", symbol: "¥" },
  { code: "GBP", symbol: "£" },
  { code: "AUD", symbol: "A$" },
  { code: "CAD", symbol: "C$" },
  { code: "CHF", symbol: "CHF" },
  { code: "CNY", symbol: "¥" },
  { code: "HKD", symbol: "HK$" },
  { code: "SGD", symbol: "S$" },
  { code: "THB", symbol: "฿" },
  { code: "KRW", symbol: "₩" },
  { code: "MYR", symbol: "RM" },
  { code: "IDR", symbol: "Rp" },
  { code: "PHP", symbol: "₱" },
  { code: "INR", symbol: "₹" },
  { code: "TWD", symbol: "NT$" },
];

export function symbolForCurrency(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}
