"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/hooks/use-auth";
import { isGoogleOnlyAccount } from "@/lib/utils/identities";
import { toQueryDate } from "@/lib/utils";
import { useT } from "@/lib/i18n/use-t";
import { ROUTES } from "@/lib/constants/routes";

const STORAGE_KEY = "wallio:password-reminder-last-shown";

function shownToday(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) === toQueryDate(new Date());
}

/** Nhắc người dùng chỉ đăng nhập bằng Google đặt thêm mật khẩu đăng nhập, để có thể vào lại app
 * qua email + mật khẩu ngay cả khi không dùng được Google lúc đó. Cùng khuôn mẫu PinReminderModal. */
export function PasswordReminderModal() {
  const { user, loading } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  const open = !loading && isGoogleOnlyAccount(user) && !dismissed && !shownToday();

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, toQueryDate(new Date()));
    setDismissed(true);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent className="text-center sm:max-w-sm">
        <DialogHeader className="items-center text-center sm:text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <KeyRound className="size-6" />
          </div>
          <DialogTitle>{t("auth.passwordReminder.title")}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-muted-foreground">{t("auth.passwordReminder.description")}</p>
        </DialogBody>
        <DialogFooter className="sm:justify-center">
          <Button variant="outline" onClick={dismiss} className="sm:flex-1">
            {t("auth.passwordReminder.later")}
          </Button>
          <Button
            onClick={() => {
              dismiss();
              router.push(ROUTES.profile);
            }}
            className="sm:flex-1"
          >
            {t("auth.passwordReminder.setNow")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
