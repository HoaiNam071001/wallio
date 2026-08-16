/**
 * Băm PIN 6 số ở phía client trước khi lưu — đây là khoá màn hình tiện lợi trên một
 * phiên Supabase ĐÃ đăng nhập (RLS mới là ranh giới bảo mật thật sự), không phải lớp
 * xác thực thứ hai, nên SHA-256 + salt = user id là đủ dùng.
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

/**
 * Trạng thái "đã mở khoá PIN" lưu ở localStorage dưới dạng mốc hoạt động gần nhất.
 *
 * Không dùng sessionStorage được: trên PWA mobile, khi chuyển sang app khác, hệ điều hành
 * có thể thu hồi webview — lúc quay lại app khởi động như một phiên hoàn toàn mới nên cờ
 * sessionStorage biến mất và bắt nhập PIN dù người dùng chỉ rời đi vài giây.
 *
 * Mốc này trượt theo lần hoạt động gần nhất: quay lại trong vòng PIN_IDLE_TIMEOUT_MS thì
 * vẫn mở khoá, rời lâu hơn mới phải nhập lại. Cờ bị xoá chủ động khi đăng xuất.
 */
const PIN_UNLOCK_KEY = "wallio:pin-unlocked-at";

/** Rời app lâu hơn khoảng này thì phải nhập PIN lại. */
export const PIN_IDLE_TIMEOUT_MS = 2 * 60 * 1000;

export function isPinUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  const at = Number(window.localStorage.getItem(PIN_UNLOCK_KEY));
  if (!Number.isFinite(at) || at <= 0) return false;
  // Mốc nằm ở tương lai = đồng hồ máy bị chỉnh lùi → coi như hết hạn cho an toàn.
  const elapsed = Date.now() - at;
  return elapsed >= 0 && elapsed < PIN_IDLE_TIMEOUT_MS;
}

export function markPinUnlocked(): void {
  window.localStorage.setItem(PIN_UNLOCK_KEY, String(Date.now()));
}

/** Gia hạn mốc mở khoá khi app đang được dùng; không tự mở khoá lại nếu đã hết hạn. */
export function touchPinUnlock(): void {
  if (!isPinUnlocked()) return;
  markPinUnlocked();
}

export function clearPinUnlocked(): void {
  window.localStorage.removeItem(PIN_UNLOCK_KEY);
}

/**
 * Đánh dấu "quên mật khẩu" trước khi sign-out + đăng nhập lại Google. Dùng localStorage
 * (không phải sessionStorage) vì redirect OAuth có thể mất session storage trên một số
 * trình duyệt di động. Cờ này được PinGate đọc lại sau khi đăng nhập xong để hiện form
 * đặt mật khẩu mới thay vì màn hình nhập mã cũ.
 */
const PIN_RESET_KEY = "wallio:pin-reset-requested";

export function isPinResetRequested(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(PIN_RESET_KEY) === "1";
}

export function markPinResetRequested(): void {
  window.localStorage.setItem(PIN_RESET_KEY, "1");
}

export function clearPinResetRequested(): void {
  window.localStorage.removeItem(PIN_RESET_KEY);
}
