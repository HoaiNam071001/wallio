"use client";

import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { ArrowDownLeft, ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { AmountText } from "@/components/shared/amount-text";
import { useAmountVisibility } from "@/lib/hooks/use-amount-visibility";
import { useT } from "@/lib/i18n/use-t";
import type { TFunction } from "i18next";

function greeting(t: TFunction, date: Date): string {
  const hour = date.getHours();
  if (hour < 11) return t("transactions.todayHero.greetingMorning");
  if (hour < 14) return t("transactions.todayHero.greetingNoon");
  if (hour < 18) return t("transactions.todayHero.greetingAfternoon");
  return t("transactions.todayHero.greetingEvening");
}

/**
 * Thẻ mở đầu của app: điều người dùng muốn thấy ngay khi vào là thu/chi HÔM NAY,
 * không phải tổng tài sản.
 */
export function TodayHero({
  income,
  expense,
  loading,
}: {
  income: number;
  expense: number;
  loading?: boolean;
}) {
  const today = new Date();
  const [visible, toggle] = useAmountVisibility("transactions");
  const { t, locale } = useT();

  return (
    <section className="brand-gradient relative overflow-hidden rounded-xl p-4 text-white shadow-glow">
      {/* Đốm sáng trang trí */}
      <div className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-12 size-48 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-xs font-medium text-white/80">
          {greeting(t, today)} 👋 ·{" "}
          {format(today, "EEEE, dd/MM", { locale: locale === "en" ? enUS : vi })}
        </p>
        <button
          type="button"
          onClick={toggle}
          aria-label={visible ? t("common.hideAmount") : t("common.showAmount")}
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur transition-transform active:scale-95"
        >
          {visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
        </button>
      </div>

      <div className="relative mt-2.5">
        <p className="text-[10px] font-semibold tracking-wide text-white/75 uppercase">
          {t("transactions.todayHero.spentToday")}
        </p>
        <p className="text-3xl leading-tight font-extrabold tabular-nums">
          {loading ? "—" : <AmountText amount={expense} scope="transactions" />}
        </p>
      </div>

      <div className="relative mt-2.5 grid grid-cols-2 gap-2">
        <div className="min-w-0 rounded-xl bg-white/15 px-2.5 py-1.5 backdrop-blur">
          <span className="flex items-center gap-1 text-[10px] font-semibold text-white/80">
            <ArrowDownLeft className="size-3 shrink-0" />
            <span className="truncate">{t("transactions.todayHero.incomeToday")}</span>
          </span>
          <span className="block text-xs font-bold tabular-nums">
            {loading ? "—" : <AmountText amount={income} scope="transactions" />}
          </span>
        </div>
        <div className="min-w-0 rounded-xl bg-white/15 px-2.5 py-1.5 backdrop-blur">
          <span className="flex items-center gap-1 text-[10px] font-semibold text-white/80">
            <ArrowUpRight className="size-3 shrink-0" />
            <span className="truncate">{t("transactions.todayHero.difference")}</span>
          </span>
          <span className="block text-xs font-bold tabular-nums">
            {loading ? "—" : <AmountText amount={income - expense} scope="transactions" />}
          </span>
        </div>
      </div>
    </section>
  );
}
