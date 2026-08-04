"use client";

import { useTranslation } from "react-i18next";

export function I18n({
  k,
  vars,
}: {
  k: string;
  vars?: Record<string, string | number>;
}) {
  const { t } = useTranslation();
  return <>{t(k, vars)}</>;
}
