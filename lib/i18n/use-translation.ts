"use client";

import { useLocale } from "@/lib/i18n/locale-store";
import { vi } from "@/lib/i18n/dictionaries/vi";
import { en } from "@/lib/i18n/dictionaries/en";
import type { Dictionary } from "@/lib/i18n/dictionaries/vi";

const dictionaries: Record<"vi" | "en", Dictionary> = { vi, en };

export function useTranslation() {
  const [locale, setLocale] = useLocale();
  return { t: dictionaries[locale], locale, setLocale };
}
