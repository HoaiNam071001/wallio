"use client";

import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import vi from "./resources/vi.json";
import en from "./resources/en.json";

export const LOCALE_STORAGE_KEY = "wallio:locale";
export type Locale = "vi" | "en";

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources: { vi: { translation: vi }, en: { translation: en } },
    // Always start at "vi" to match the server-rendered <html lang="vi">; the
    // real stored locale (if different) is applied post-mount by I18nBootstrap.
    lng: "vi",
    fallbackLng: "vi",
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  i18next.on("languageChanged", (lng) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCALE_STORAGE_KEY, lng);
    document.documentElement.lang = lng;
  });
}

export default i18next;
