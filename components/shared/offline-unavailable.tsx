"use client";

import { WifiOff } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { useT } from "@/lib/i18n/use-t";

/** Thay thế nội dung của các màn cần API (Tổng quan, Báo cáo, danh sách giao dịch...) khi offline. */
export function OfflineUnavailable({ className }: { className?: string }) {
  const { t } = useT();

  return (
    <EmptyState
      icon={WifiOff}
      title={t("offline.unavailable.title")}
      description={t("offline.unavailable.description")}
      className={className}
    />
  );
}
