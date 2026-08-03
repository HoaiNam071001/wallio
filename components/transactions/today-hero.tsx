"use client";

import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

function greeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
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

  return (
    <section className="brand-gradient relative overflow-hidden rounded-3xl p-5 text-white shadow-glow">
      {/* Đốm sáng trang trí */}
      <div className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-12 size-48 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white/80">{greeting(today)} 👋</p>
          <p className="text-xs text-white/70">
            {format(today, "EEEE, dd MMMM yyyy", { locale: vi })}
          </p>
        </div>
        <Link
          href="/transactions/new"
          className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur transition-transform active:scale-95"
        >
          <Plus className="size-3.5" />
          Ghi ngay
        </Link>
      </div>

      <div className="relative mt-4">
        <p className="text-xs font-semibold tracking-wide text-white/75 uppercase">
          Đã chi hôm nay
        </p>
        <p className="text-4xl font-extrabold tabular-nums">
          {loading ? "—" : formatCurrency(expense)}
        </p>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/80">
            <ArrowDownLeft className="size-3.5" />
            Thu hôm nay
          </div>
          <p className="mt-0.5 text-base font-extrabold tabular-nums">
            {loading ? "—" : formatCurrency(income)}
          </p>
        </div>
        <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/80">
            <ArrowUpRight className="size-3.5" />
            Chênh lệch
          </div>
          <p className="mt-0.5 text-base font-extrabold tabular-nums">
            {loading ? "—" : formatCurrency(income - expense)}
          </p>
        </div>
      </div>
    </section>
  );
}
