"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/hooks/use-auth";
import { useProfile, useUpsertProfile } from "@/lib/hooks/use-profile";
import { useSupabase } from "@/lib/hooks/use-supabase";
import {
  clearPinResetRequested,
  clearPinUnlocked,
  hashPin,
  isPinResetRequested,
  isPinUnlockedInSession,
  isValidPin,
  markPinResetRequested,
  markPinUnlocked,
} from "@/lib/utils/pin";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/use-t";
import { ROUTES } from "@/lib/constants/routes";

/**
 * Khoá toàn màn hình sau khi đã đăng nhập Google, nếu người dùng đã đặt PIN 6 số.
 * Đây là lớp tiện lợi trên một phiên Supabase đã xác thực — RLS mới là ranh giới bảo mật thật.
 */
export function PinGate({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const supabase = useSupabase();
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(isPinUnlockedInSession);
  const [resetMode, setResetMode] = useState(isPinResetRequested);
  const [digits, setDigits] = useState<string[]>(() => Array(6).fill(""));
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pin = digits.join("");

  const needsPin = !authLoading && !profileLoading && !!user && !!profile?.pin_hash && !unlocked;

  if (!needsPin) return <>{children}</>;

  function resetDigits() {
    setDigits(Array(6).fill(""));
    boxRefs.current[0]?.focus();
  }

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    setError(false);
    if (digit && index < 5) boxRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Backspace" || digits[index] || index <= 0) return;
    boxRefs.current[index - 1]?.focus();
    setDigits((prev) => {
      const next = [...prev];
      next[index - 1] = "";
      return next;
    });
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    setDigits(Array.from({ length: 6 }, (_, i) => pasted[i] ?? ""));
    setError(false);
    boxRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isValidPin(pin) || !user || !profile?.pin_hash) return;

    setVerifying(true);
    const hash = await hashPin(pin, user.id);
    setVerifying(false);

    if (hash === profile.pin_hash) {
      markPinUnlocked();
      setUnlocked(true);
    } else {
      setError(true);
      resetDigits();
    }
  }

  async function handleForgot() {
    markPinResetRequested();
    clearPinUnlocked();
    await supabase.auth.signOut();
    router.replace(ROUTES.login);
  }

  if (resetMode) {
    return (
      <ResetPinForm
        userId={user?.id}
        onDone={() => {
          clearPinResetRequested();
          markPinUnlocked();
          setUnlocked(true);
          setResetMode(false);
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="glass w-full max-w-xs rounded-xl p-7 text-center">
        <div className="brand-gradient mx-auto flex size-16 items-center justify-center rounded-xl shadow-glow">
          <LockKeyhole className="size-7 text-white" />
        </div>
        <h1 className="mt-4 text-lg font-extrabold">{t("auth.pinGate.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("auth.pinGate.subtitle")}</p>

        <div className="mt-6 flex justify-between gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                boxRefs.current[index] = el;
              }}
              autoFocus={index === 0}
              type="password"
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              value={digit}
              onChange={(event) => handleDigitChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={handlePaste}
              className={cn(
                "aspect-square min-w-0 flex-1 rounded-2xl border bg-card/70 text-center text-xl font-extrabold outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15",
                error ? "border-destructive" : "border-input",
              )}
            />
          ))}
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{t("auth.pinGate.wrongPin")}</p>}

        <Button
          type="submit"
          size="lg"
          className="mt-6 w-full"
          disabled={pin.length !== 6 || verifying}
        >
          {verifying ? t("auth.pinGate.checking") : t("auth.pinGate.unlock")}
        </Button>
        <button
          type="button"
          onClick={handleForgot}
          className="mt-4 text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline"
        >
          {t("auth.pinGate.forgot")}
        </button>
      </form>
    </div>
  );
}

/** Hiện ra sau khi user bấm "Quên mật khẩu?" và đăng nhập lại Google thành công — đăng nhập
 * lại đã tự chứng minh danh tính rồi nên cho đặt PIN mới ngay, không cần nhập PIN cũ. */
function ResetPinForm({ userId, onDone }: { userId: string | undefined; onDone: () => void }) {
  const { t } = useT();
  const upsertProfile = useUpsertProfile();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isValidPin(pin)) {
      setError(t("profile.pin.errorLength"));
      return;
    }
    if (pin !== confirmPin) {
      setError(t("profile.pin.errorMismatch"));
      return;
    }
    if (!userId) return;

    const hash = await hashPin(pin, userId);
    upsertProfile.mutate(
      { pin_hash: hash, pin_set_at: new Date().toISOString() },
      {
        onSuccess: () => {
          toast.success(t("profile.pin.toastChanged"));
          onDone();
        },
      },
    );
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="glass w-full max-w-xs rounded-xl p-7 text-center">
        <div className="brand-gradient mx-auto flex size-16 items-center justify-center rounded-xl shadow-glow">
          <KeyRound className="size-7 text-white" />
        </div>
        <h1 className="mt-4 text-lg font-extrabold">{t("auth.pinGate.resetTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("auth.pinGate.resetSubtitle")}</p>

        <div className="mt-6 flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-2">
            <Label htmlFor="reset-pin">{t("profile.pin.newPinLabel")}</Label>
            <Input
              id="reset-pin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reset-pin-confirm">{t("profile.pin.confirmLabel")}</Label>
            <Input
              id="reset-pin-confirm"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={confirmPin}
              onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
            />
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

        <Button type="submit" size="lg" className="mt-6 w-full" disabled={upsertProfile.isPending}>
          {upsertProfile.isPending ? t("common.saving") : t("auth.pinGate.resetSubmit")}
        </Button>
      </form>
    </div>
  );
}
