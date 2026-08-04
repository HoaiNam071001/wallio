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
 * Trạng thái "đã mở khoá PIN" lưu ở sessionStorage — sống sót qua pull-to-refresh /
 * reload trang (khác với biến trong bộ nhớ JS), nhưng tự xoá khi đóng hẳn tab/app,
 * và bị xoá chủ động khi đăng xuất — nên chỉ cần nhập PIN lại mỗi phiên đăng nhập mới.
 */
const PIN_UNLOCK_KEY = "wallio:pin-unlocked";

export function isPinUnlockedInSession(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(PIN_UNLOCK_KEY) === "1";
}

export function markPinUnlocked(): void {
  window.sessionStorage.setItem(PIN_UNLOCK_KEY, "1");
}

export function clearPinUnlocked(): void {
  window.sessionStorage.removeItem(PIN_UNLOCK_KEY);
}
