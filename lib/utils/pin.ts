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
