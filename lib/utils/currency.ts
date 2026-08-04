const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

const compactFormatter = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** 1250000 -> "1.250.000 ₫" */
export function formatCurrency(amount: number): string {
  return vndFormatter.format(amount);
}

/** 1250000 -> "1.250.000" (không kèm ký hiệu tiền tệ) */
export function formatAmount(amount: number): string {
  return numberFormatter.format(amount);
}

/** 1250000 -> "1,3 Tr" — dùng cho trục biểu đồ và số liệu gọn */
export function formatCompact(amount: number): string {
  return compactFormatter.format(amount);
}

/**
 * Định dạng số theo đơn vị của nguồn tiền: VNĐ như bình thường, riêng nguồn "Hiện vật"
 * (vàng, cổ phiếu...) không có giá cố định nên hiện theo đơn vị tự khai của nó (vd: "2 chỉ").
 */
export function formatAccountAmount(
  amount: number,
  account: { type: string; unit?: string | null },
): string {
  if (account.type !== "in_kind") return formatCurrency(amount);
  const unit = account.unit?.trim();
  return unit ? `${formatAmount(amount)} ${unit}` : formatAmount(amount);
}

/** "1.250.000 ₫" -> 1250000; chuỗi rỗng -> undefined */
export function parseAmount(value: string): number | undefined {
  const negative = value.trim().startsWith("-");
  const digits = value.replace(/\D/g, "");
  if (!digits) return undefined;
  return Number(digits) * (negative ? -1 : 1);
}

/** Giữ tương thích với code cũ: luôn trả về number (rỗng -> 0). */
export function parseCurrencyInput(value: string): number {
  return parseAmount(value) ?? 0;
}
