"use client";

import { useTranslation } from "react-i18next";
import type { Locale } from "./index";

/** Compat wrapper for call sites that need `t` as a callable (attributes, toasts,
 * arrays via `returnObjects`, or plain helper functions) rather than via `<I18n>`. */
export function useT() {
  const { t, i18n } = useTranslation();
  return {
    t,
    locale: i18n.language as Locale,
    setLocale: (next: Locale) => {
      i18n.changeLanguage(next);
    },
  };
}
