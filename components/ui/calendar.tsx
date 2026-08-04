"use client";

import * as React from "react";
import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";

/** Lịch tháng tự vẽ (không phụ thuộc UI native của trình duyệt) — dùng cho desktop. */
export function Calendar({
  value,
  onSelect,
  maxDate,
  minDate,
}: {
  value?: string;
  onSelect: (date: string) => void;
  maxDate?: string;
  minDate?: string;
}) {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "en" ? enUS : vi;
  const selected = value ? parseISO(value) : undefined;
  const [month, setMonth] = React.useState(() => selected ?? new Date());

  // Luôn đúng 6 tuần (42 ô) để chiều cao lịch không nhảy khi chuyển tháng —
  // có tháng chỉ cần 5 hàng, có tháng cần 6, nếu để tự nhiên sẽ làm popover đổi cao.
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  const max = maxDate ? parseISO(maxDate) : undefined;
  const min = minDate ? parseISO(minDate) : undefined;

  return (
    <div className="w-64">
      <div className="flex items-center justify-between px-1 pb-2">
        <button
          type="button"
          onClick={() => setMonth((m) => subMonths(m, 1))}
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          aria-label={t.calendar.prevMonth}
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-bold capitalize">
          {format(month, "MMMM yyyy", { locale: dateLocale })}
        </span>
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          aria-label={t.calendar.nextMonth}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 px-1 pb-1 text-center text-[11px] font-bold text-muted-foreground">
        {t.calendar.weekdays.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1 px-1">
        {days.map((day) => {
          const outside = !isSameMonth(day, month);
          const selectedDay = selected && isSameDay(day, selected);
          const disabled = (max && day > max) || (min && day < min);
          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(format(day, "yyyy-MM-dd"))}
              className={cn(
                "mx-auto flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                outside && "text-muted-foreground/35",
                !outside && !selectedDay && "text-foreground hover:bg-accent",
                selectedDay && "brand-gradient text-white shadow-glow",
                !selectedDay && isToday(day) && "font-extrabold text-brand-600",
                disabled && "pointer-events-none",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
