"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ChartType = "pie" | "bar" | "flat";

function storageKey(scope: string): string {
  return `wallio:chartType:${scope}`;
}

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function readChartType(scope: string): ChartType {
  // "bar" mặc định vì gọn hơn donut — chỉ đổi khi người dùng tự chọn loại khác.
  const stored = localStorage.getItem(storageKey(scope));
  return stored === "pie" || stored === "flat" ? stored : "bar";
}

function writeChartType(scope: string, type: ChartType) {
  localStorage.setItem(storageKey(scope), type);
  notify();
}

function getServerSnapshot(): ChartType {
  return "bar";
}

/** [loại chart đã chọn cho trang này, hàm đổi] — lưu riêng theo từng trang (scope). */
export function useChartType(scope: string): [ChartType, (type: ChartType) => void] {
  const type = useSyncExternalStore(subscribe, () => readChartType(scope), getServerSnapshot);
  const setType = useCallback((next: ChartType) => writeChartType(scope, next), [scope]);
  return [type, setType];
}
