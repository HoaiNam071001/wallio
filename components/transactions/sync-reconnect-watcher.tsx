"use client";

import { useEffect, useRef } from "react";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { usePendingTransactions } from "@/lib/hooks/use-pending-transactions";
import { openSyncOfflineModal } from "@/lib/hooks/use-sync-offline-modal";

/**
 * Không render gì — tự mở `SyncOfflineModal` khi mạng vừa có lại (hoặc app vừa mở đã có mạng
 * sẵn nhưng còn giao dịch offline tồn từ phiên trước) để user quyết định ngay lưu tất cả hay
 * chọn từng khoản, thay vì phải tự bấm nút Sync.
 */
export function SyncReconnectWatcher() {
  const online = useOnlineStatus();
  const { count } = usePendingTransactions();
  const prevOnline = useRef(online);
  const prevCount = useRef(count);

  useEffect(() => {
    const cameOnline = !prevOnline.current && online;
    const queueJustAppeared = prevCount.current === 0 && count > 0;
    if (online && count > 0 && (cameOnline || queueJustAppeared)) {
      openSyncOfflineModal();
    }
    prevOnline.current = online;
    prevCount.current = count;
  }, [online, count]);

  return null;
}
