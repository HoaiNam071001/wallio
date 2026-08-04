"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/use-auth";
import { useProfile } from "@/lib/hooks/use-profile";
import { useSupabase } from "@/lib/hooks/use-supabase";
import { hashPin, isValidPin } from "@/lib/utils/pin";
import { cn } from "@/lib/utils";

/**
 * Cờ trong bộ nhớ — KHÔNG lưu vào localStorage/sessionStorage. Điều hướng trong app
 * (client-side) giữ nguyên trạng thái mở khoá, nhưng tải lại trang / mở app lại sẽ
 * xoá module này khỏi bộ nhớ, buộc nhập PIN lại — đúng yêu cầu "mỗi lần mở/tải lại app".
 */
let unlockedForThisLoad = false;

/**
 * Khoá toàn màn hình sau khi đã đăng nhập Google, nếu người dùng đã đặt PIN 6 số.
 * Đây là lớp tiện lợi trên một phiên Supabase đã xác thực — RLS mới là ranh giới bảo mật thật.
 */
export function PinGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const supabase = useSupabase();
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(unlockedForThisLoad);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const needsPin = !authLoading && !profileLoading && !!user && !!profile?.pin_hash && !unlocked;

  if (!needsPin) return <>{children}</>;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isValidPin(pin) || !user || !profile?.pin_hash) return;

    setVerifying(true);
    const hash = await hashPin(pin, user.id);
    setVerifying(false);

    if (hash === profile.pin_hash) {
      unlockedForThisLoad = true;
      setUnlocked(true);
    } else {
      setError(true);
      setPin("");
    }
  }

  async function handleForgot() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="glass w-full max-w-xs rounded-3xl p-7 text-center">
        <div className="brand-gradient mx-auto flex size-16 items-center justify-center rounded-3xl shadow-glow">
          <LockKeyhole className="size-7 text-white" />
        </div>
        <h1 className="mt-4 text-lg font-extrabold">Nhập mật khẩu</h1>
        <p className="mt-1 text-sm text-muted-foreground">Nhập mã 6 số để mở Wallio</p>

        <input
          autoFocus
          type="password"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={pin}
          onChange={(event) => {
            setPin(event.target.value.replace(/\D/g, "").slice(0, 6));
            setError(false);
          }}
          className={cn(
            "mt-6 h-14 w-full rounded-2xl border bg-card/70 text-center text-2xl font-extrabold tracking-[0.6em] outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15",
            error ? "border-destructive" : "border-input",
          )}
        />
        {error && <p className="mt-2 text-sm text-destructive">Sai mật khẩu, thử lại.</p>}

        <Button
          type="submit"
          size="lg"
          className="mt-6 w-full"
          disabled={pin.length !== 6 || verifying}
        >
          {verifying ? "Đang kiểm tra..." : "Mở khoá"}
        </Button>
        <button
          type="button"
          onClick={handleForgot}
          className="mt-4 text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline"
        >
          Quên mật khẩu?
        </button>
      </form>
    </div>
  );
}
