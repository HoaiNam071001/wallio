"use client";

import { useSyncExternalStore } from "react";

let isOpen = false;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return isOpen;
}

function getServerSnapshot() {
  return false;
}

/** Mở modal "Đồng bộ giao dịch offline" từ bất kỳ đâu trong app (nút Sync nổi). */
export function openSyncOfflineModal() {
  isOpen = true;
  notify();
}

export function closeSyncOfflineModal() {
  isOpen = false;
  notify();
}

/** Trạng thái mở/đóng của modal Sync toàn cục. */
export function useSyncOfflineModalOpen(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
