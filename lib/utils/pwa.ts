import { ROUTES } from "@/lib/constants/routes";

/**
 * App đã cài (PWA standalone / iOS "Add to Home Screen") → vào thẳng app. Mở từ trình duyệt thường
 * (không standalone) → về trang chủ, bấm "Vào app" mới vào. Chỉ gọi được phía client (dùng `window`),
 * nên chỉ gọi trong event handler, không gọi trong lúc render (server component vẫn render trang
 * "use client" này lúc SSR).
 */
export function nextDestination(): string {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isStandalone ? ROUTES.transactions : ROUTES.home;
}
