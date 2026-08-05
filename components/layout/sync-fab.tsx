"use client";

import { usePathname } from "next/navigation";
import { CloudUpload } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import { useT } from "@/lib/i18n/use-t";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { usePendingTransactions } from "@/lib/hooks/use-pending-transactions";
import { openSyncOfflineModal } from "@/lib/hooks/use-sync-offline-modal";

/**
 * Nút nổi phụ cạnh `QuickAddFab` — chỉ hiện khi có giao dịch offline chưa đồng bộ, để người dùng
 * luôn thấy và mở modal Sync (`SyncOfflineModal`) bất kể đang online hay offline.
 */
export function SyncFab() {
  const pathname = usePathname();
  const { t } = useT();
  const online = useOnlineStatus();
  const { count } = usePendingTransactions();

  if (pathname.startsWith(ROUTES.newTransaction)) return null;
  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={openSyncOfflineModal}
      aria-label={t("layout.sync", { count })}
      className="fixed right-24 bottom-24 z-40 flex size-12 items-center justify-center rounded-full border border-brand-600/30 bg-card text-brand-600 shadow-lg transition-transform active:scale-90 md:right-6 md:bottom-24"
    >
      <CloudUpload className="size-5" strokeWidth={2.5} />
      <span
        className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white"
        aria-hidden
      >
        {count > 9 ? "9+" : count}
      </span>
      {!online && <span className="sr-only">{t("offline.sync.needsNetwork")}</span>}
    </button>
  );
}
