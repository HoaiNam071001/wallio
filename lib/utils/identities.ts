import type { User } from "@supabase/supabase-js";

/** true nếu tài khoản đã có identity "email" — tức đã từng đặt mật khẩu (qua signUp hoặc updateUser). */
export function hasPasswordIdentity(user: User | null | undefined): boolean {
  return !!user?.identities?.some((identity) => identity.provider === "email");
}

/** true nếu tài khoản chỉ đăng nhập qua Google và chưa từng đặt mật khẩu — dùng để nhắc đặt mật khẩu. */
export function isGoogleOnlyAccount(user: User | null | undefined): boolean {
  if (!user) return false;
  const hasGoogle = user.identities?.some((identity) => identity.provider === "google") ?? false;
  return hasGoogle && !hasPasswordIdentity(user);
}
