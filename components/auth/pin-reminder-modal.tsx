"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProfile } from "@/lib/hooks/use-profile";
import { toQueryDate } from "@/lib/utils";

const STORAGE_KEY = "wallio:pin-reminder-last-shown";

function shownToday(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) === toQueryDate(new Date());
}

export function PinReminderModal() {
  const { data: profile, isLoading } = useProfile();
  const router = useRouter();
  // Chỉ cần nhớ việc "đã bấm để tắt" trong phiên này — điều kiện hiện hay không được
  // tính lại mỗi lần render từ profile + localStorage, không cần đồng bộ qua effect.
  const [dismissed, setDismissed] = useState(false);

  const open = !isLoading && !!profile && !profile.pin_hash && !dismissed && !shownToday();

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, toQueryDate(new Date()));
    setDismissed(true);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent className="text-center sm:max-w-sm">
        <DialogHeader className="items-center text-center sm:text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="size-6" />
          </div>
          <DialogTitle>Bạn chưa đặt mật khẩu 6 số</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Đặt mật khẩu 6 số để khoá app lại mỗi khi mở lên, bảo vệ dữ liệu thu chi của bạn tốt hơn.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={dismiss} className="sm:flex-1">
            Để sau
          </Button>
          <Button
            onClick={() => {
              dismiss();
              router.push("/profile");
            }}
            className="sm:flex-1"
          >
            Đặt ngay
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
