/** Bảng màu dùng chung cho danh mục, nguồn tiền và biểu đồ. */

export interface SwatchOption {
  name: string;
  value: string;
}

export const COLOR_SWATCHES: SwatchOption[] = [
  { name: "Xanh dương", value: "#3b82f6" },
  { name: "Xanh biển", value: "#0ea5e9" },
  { name: "Ngọc lam", value: "#06b6d4" },
  { name: "Bạc hà", value: "#10b981" },
  { name: "Lá cây", value: "#22c55e" },
  { name: "Chanh", value: "#84cc16" },
  { name: "Vàng nắng", value: "#f59e0b" },
  { name: "Cam", value: "#f97316" },
  { name: "Đỏ san hô", value: "#ef4444" },
  { name: "Hồng", value: "#ec4899" },
  { name: "Tím", value: "#a855f7" },
  { name: "Chàm", value: "#6366f1" },
  { name: "Nâu đất", value: "#b45309" },
  { name: "Xám khói", value: "#64748b" },
];

export const DEFAULT_COLOR = COLOR_SWATCHES[0].value;

/** Màu vẽ chart khi bản ghi chưa gán màu riêng. */
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

/** Ghép alpha vào mã hex 6 ký tự -> dùng cho nền nhạt của icon chip. */
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

/** Màu ổn định theo index, dùng khi item chưa có màu riêng. */
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
