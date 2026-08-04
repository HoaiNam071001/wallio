"use client";

import { useEffect } from "react";
import { useProfile } from "@/lib/hooks/use-profile";
import { syncCurrency } from "@/lib/hooks/use-currency";

/** Không render gì — chỉ giữ ký hiệu tiền dùng trong `formatCurrency` luôn khớp với hồ sơ đã lưu. */
export function CurrencyEffect() {
  const { data: profile } = useProfile();

  useEffect(() => {
    if (!profile) return;
    syncCurrency(profile.currency_code, profile.currency_symbol);
  }, [profile]);

  return null;
}
