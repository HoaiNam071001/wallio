"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export const THEME_STORAGE_KEY = "wallio:theme";
export type Theme = "light" | "dark" | "system";

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function readTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

function writeTheme(theme: Theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  notify();
}

function getServerSnapshot(): Theme {
  return "system";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

function applyResolvedTheme(resolved: "light" | "dark") {
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

/** [theme đã chọn ("system" nếu chưa từng chọn), hàm đổi theme] — áp dụng ngay lên <html>. */
export function useTheme(): [Theme, (theme: Theme) => void] {
  const theme = useSyncExternalStore(subscribe, readTheme, getServerSnapshot);
  const setTheme = useCallback((next: Theme) => writeTheme(next), []);

  useEffect(() => {
    applyResolvedTheme(resolveTheme(theme));
    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyResolvedTheme(resolveTheme("system"));
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  return [theme, setTheme];
}
