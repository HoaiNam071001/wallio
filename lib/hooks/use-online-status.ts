"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

/** true khi đang có mạng — phản ứng theo sự kiện online/offline của trình duyệt. */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Đọc đồng bộ ngay lập tức, dùng trong mutationFn ngoài React. */
export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}
