const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return vndFormatter.format(amount);
}

export function parseCurrencyInput(value: string): number {
  const digitsOnly = value.replace(/[^\d-]/g, "");
  return digitsOnly ? Number(digitsOnly) : 0;
}
