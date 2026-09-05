/** Helper màu dùng chung cho mọi "entity có màu riêng" (category, tag, label, project...). */

export interface SwatchOption {
  name: string;
  value: string;
}

/** Bộ màu gợi ý cho color-picker khi user tạo entity mới — đổi tự do theo domain/brand. */
export const COLOR_SWATCHES: SwatchOption[] = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Mint", value: "#10b981" },
  { name: "Green", value: "#22c55e" },
  { name: "Lime", value: "#84cc16" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Orange", value: "#f97316" },
  { name: "Red", value: "#ef4444" },
  { name: "Pink", value: "#ec4899" },
  { name: "Purple", value: "#a855f7" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Brown", value: "#b45309" },
  { name: "Slate", value: "#64748b" },
];

export const DEFAULT_COLOR = COLOR_SWATCHES[0].value;

/** Màu vẽ chart khi bản ghi chưa được gán màu riêng. */
export const CHART_PALETTE = [
  "#3b82f6",
  "#f97316",
  "#10b981",
  "#a855f7",
  "#ec4899",
  "#06b6d4",
  "#f59e0b",
  "#6366f1",
  "#22c55e",
  "#ef4444",
];

/** Ghép alpha vào mã hex 6 ký tự — dùng cho nền nhạt của icon chip (không tô nền đặc bằng màu entity). */
export function withAlpha(hex: string | null | undefined, alpha: number): string {
  const base = normalizeColor(hex);
  const clamped = Math.round(Math.min(Math.max(alpha, 0), 1) * 255);
  return `${base}${clamped.toString(16).padStart(2, "0")}`;
}

/** Trả về mã màu hợp lệ (#rrggbb), fallback về màu mặc định. */
export function normalizeColor(hex: string | null | undefined): string {
  if (hex && /^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  return DEFAULT_COLOR;
}

/** Màu ổn định theo vị trí, dùng khi item chưa có màu riêng. */
export function colorAt(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

/**
 * Màu fallback gắn với chính danh tính của bản ghi (hash từ id), không phải
 * theo thứ hạng — nhờ vậy lọc bớt item không làm đổi màu các item còn lại.
 */
export function colorForKey(key: string | null | undefined, explicit?: string | null): string {
  if (explicit && /^#[0-9a-fA-F]{6}$/.test(explicit)) return explicit;
  if (!key) return CHART_PALETTE[0];

  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return CHART_PALETTE[hash % CHART_PALETTE.length];
}
