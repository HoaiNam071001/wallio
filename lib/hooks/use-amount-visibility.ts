"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Các trang có hiển thị số tiền — mỗi trang nhớ trạng thái ẩn/hiện riêng. */
export const AMOUNT_VISIBILITY_SCOPES = ["dashboard", "transactions", "accounts", "reports"] as const;
export type AmountVisibilityScope = (typeof AMOUNT_VISIBILITY_SCOPES)[number];

function storageKey(scope: AmountVisibilityScope): string {
  return `wallio:amounts:${scope}`;
}

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function readVisible(scope: AmountVisibilityScope): boolean {
  // Mặc định ẩn số tiền — chỉ hiện khi người dùng đã từng bật cho trang này.
  return localStorage.getItem(storageKey(scope)) === "1";
}

function writeVisible(scope: AmountVisibilityScope, visible: boolean) {
  localStorage.setItem(storageKey(scope), visible ? "1" : "0");
  notify();
}

function getServerSnapshot() {
  return false;
}

/** [đang hiện?, hàm đảo trạng thái] cho một trang cụ thể. */
export function useAmountVisibility(scope: AmountVisibilityScope): [boolean, () => void] {
  const visible = useSyncExternalStore(subscribe, () => readVisible(scope), getServerSnapshot);
  const toggle = useCallback(() => writeVisible(scope, !readVisible(scope)), [scope]);
  return [visible, toggle];
}

/** Đặt hiện/ẩn cho tất cả các trang cùng lúc — dùng ở Hồ sơ. */
export function setAllAmountVisibility(visible: boolean) {
  for (const scope of AMOUNT_VISIBILITY_SCOPES) writeVisible(scope, visible);
}
