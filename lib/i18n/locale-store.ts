"use client";

import { useCallback, useSyncExternalStore } from "react";

export const LOCALE_STORAGE_KEY = "wallio:locale";
export type Locale = "vi" | "en";

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function readLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === "en" ? "en" : "vi";
}

function writeLocale(locale: Locale) {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
  notify();
}

function getServerSnapshot(): Locale {
  return "vi";
}

/** [locale hiện tại, hàm đổi locale] — mặc định "vi" nếu chưa từng chọn. */
export function useLocale(): [Locale, (locale: Locale) => void] {
  const locale = useSyncExternalStore(subscribe, readLocale, getServerSnapshot);
  const setLocale = useCallback((next: Locale) => writeLocale(next), []);
  return [locale, setLocale];
}
