"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useT } from "@/lib/i18n/use-t";

/** Dải thông báo dính đầu trang khi mất mạng — mount 1 lần ở layout, áp dụng chung mọi trang. */
export function OfflineBanner() {
  const online = useOnlineStatus();
  const { t } = useT();

  if (online) return null;

  return (
    <div className="sticky top-0 z-30 flex items-center justify-center gap-1.5 bg-amber-500/90 px-3 py-1.5 text-center text-xs font-semibold text-white">
      <WifiOff className="size-3.5" />
      {t("offline.banner.message")}
    </div>
  );
}
