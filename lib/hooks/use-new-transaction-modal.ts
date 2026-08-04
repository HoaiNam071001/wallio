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

/** Mở modal "Ghi khoản mới" từ bất kỳ đâu trong app (FAB, nút trong trang...). */
export function openNewTransactionModal() {
  isOpen = true;
  notify();
}

export function closeNewTransactionModal() {
  isOpen = false;
  notify();
}

/** Trạng thái mở/đóng của modal "Ghi khoản mới" toàn cục — component hiển thị modal dùng hook này. */
export function useNewTransactionModalOpen(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
