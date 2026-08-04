"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_CURRENCY_CODE, symbolForCurrency } from "@/lib/constants/currencies";

export const CURRENCY_STORAGE_KEY = "wallio:currency";

export interface CurrencySetting {
  code: string;
  /** Ký hiệu thực sự hiển thị: custom nếu người dùng đặt, không thì ký hiệu mặc định của code. */
  symbol: string;
}

const DEFAULT_SETTING: CurrencySetting = {
  code: DEFAULT_CURRENCY_CODE,
  symbol: symbolForCurrency(DEFAULT_CURRENCY_CODE),
};

let cached: CurrencySetting = DEFAULT_SETTING;
let hydrated = false;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function readCurrency(): CurrencySetting {
  if (typeof window === "undefined") return cached;
  if (!hydrated) {
    hydrated = true;
    const raw = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<CurrencySetting>;
        if (parsed.code && parsed.symbol) cached = { code: parsed.code, symbol: parsed.symbol };
      } catch {
        // localStorage hỏng -> giữ mặc định
      }
    }
  }
  return cached;
}

function getServerSnapshot(): CurrencySetting {
  return DEFAULT_SETTING;
}

/**
 * Đồng bộ ký hiệu tiền dùng cho `formatCurrency` toàn hệ thống — gọi khi hồ sơ (profiles.currency_code /
 * currency_symbol) tải xong hoặc được cập nhật. Xem `components/shared/currency-effect.tsx`.
 */
export function syncCurrency(code: string, customSymbol: string | null | undefined) {
  const next: CurrencySetting = {
    code,
    symbol: customSymbol?.trim() || symbolForCurrency(code),
  };
  if (next.code === cached.code && next.symbol === cached.symbol) return;
  cached = next;
  hydrated = true;
  localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(next));
  notify();
}

/** [code, symbol] hiện tại — phản ứng theo thay đổi từ trang Hồ sơ. */
export function useCurrency(): CurrencySetting {
  return useSyncExternalStore(subscribe, readCurrency, getServerSnapshot);
}

/** Đọc đồng bộ ngay lập tức, dùng trong `lib/utils/currency.ts` (chạy ngoài React, ví dụ tickFormatter). */
export function getCurrentCurrency(): CurrencySetting {
  return readCurrency();
}
