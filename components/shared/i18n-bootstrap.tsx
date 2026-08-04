"use client";

import { useEffect } from "react";
import i18n, { LOCALE_STORAGE_KEY, type Locale } from "@/lib/i18n";

export function I18nBootstrap() {
  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if ((stored === "en" || stored === "vi") && stored !== i18n.language) {
      i18n.changeLanguage(stored);
    }
  }, []);

  return null;
}
