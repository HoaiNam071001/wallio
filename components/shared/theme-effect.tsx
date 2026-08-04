"use client";

import { useTheme } from "@/lib/hooks/use-theme";

/** Không render gì — chỉ giữ cho class `.dark` trên <html> luôn khớp với theme đã chọn. */
export function ThemeEffect() {
  useTheme();
  return null;
}
