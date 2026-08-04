"use client";

import * as React from "react";
import {
  addDays,
  addMonths,
  addYears,
  endOfMonth,
  endOfYear,
  format,
  isSameDay,
  isSameMonth,
  isSameYear,
  isToday,
  parseISO,
  setMonth,
  setYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
  subYears,
} from "date-fns";
import { vi, enUS, type Locale } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";

type View = "day" | "month" | "year";

/** Số năm hiển thị trên mỗi trang của chế độ chọn năm. */
const YEARS_PER_PAGE = 12;

/** Lịch tự vẽ (không phụ thuộc UI native của trình duyệt) — dùng cho desktop.
 * Hỗ trợ 3 chế độ chọn giống các datepicker phổ biến: chọn ngày → bấm tiêu đề
 * để chọn tháng → bấm tiếp để chọn năm, mỗi lần chọn sẽ "đi xuống" lại chế độ trước đó.
 */
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
  const [cursor, setCursor] = React.useState(() => selected ?? new Date());
  const [view, setView] = React.useState<View>("day");

  const max = maxDate ? parseISO(maxDate) : undefined;
  const min = minDate ? parseISO(minDate) : undefined;

  const goPrev = () => {
    if (view === "day") setCursor((d) => subMonths(d, 1));
    else if (view === "month") setCursor((d) => subYears(d, 1));
    else setCursor((d) => subYears(d, YEARS_PER_PAGE));
  };

  const goNext = () => {
    if (view === "day") setCursor((d) => addMonths(d, 1));
    else if (view === "month") setCursor((d) => addYears(d, 1));
    else setCursor((d) => addYears(d, YEARS_PER_PAGE));
  };

  const yearsPageStart = cursor.getFullYear() - (cursor.getFullYear() % YEARS_PER_PAGE);
  const years = Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearsPageStart + i);

  const headerLabel =
    view === "day"
      ? format(cursor, "MMMM yyyy", { locale: dateLocale })
      : view === "month"
        ? format(cursor, "yyyy", { locale: dateLocale })
        : `${years[0]} - ${years[years.length - 1]}`;

  const prevAriaLabel =
    view === "day" ? t.calendar.prevMonth : view === "month" ? t.calendar.prevYear : t.calendar.prevDecade;
  const nextAriaLabel =
    view === "day" ? t.calendar.nextMonth : view === "month" ? t.calendar.nextYear : t.calendar.nextDecade;

  return (
    <div className="w-64">
      <div className="flex items-center justify-between px-1 pb-2">
        <button
          type="button"
          onClick={goPrev}
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          aria-label={prevAriaLabel}
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setView((v) => (v === "day" ? "month" : v === "month" ? "year" : v))}
          disabled={view === "year"}
          className="rounded-full px-2 py-1 text-sm font-bold capitalize hover:bg-accent disabled:pointer-events-none"
        >
          {headerLabel}
        </button>
        <button
          type="button"
          onClick={goNext}
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          aria-label={nextAriaLabel}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {view === "day" && (
        <DayGrid cursor={cursor} selected={selected} min={min} max={max} onSelect={onSelect} />
      )}
      {view === "month" && (
        <MonthGrid
          cursor={cursor}
          selected={selected}
          min={min}
          max={max}
          dateLocale={dateLocale}
          onSelect={(next) => {
            setCursor(next);
            setView("day");
          }}
        />
      )}
      {view === "year" && (
        <YearGrid
          years={years}
          selected={selected}
          min={min}
          max={max}
          onSelect={(next) => {
            setCursor(next);
            setView("month");
          }}
        />
      )}
    </div>
  );
}

function DayGrid({
  cursor,
  selected,
  min,
  max,
  onSelect,
}: {
  cursor: Date;
  selected?: Date;
  min?: Date;
  max?: Date;
  onSelect: (date: string) => void;
}) {
  const { t } = useTranslation();

  // Luôn đúng 6 tuần (42 ô) để chiều cao lịch không nhảy khi chuyển tháng —
  // có tháng chỉ cần 5 hàng, có tháng cần 6, nếu để tự nhiên sẽ làm popover đổi cao.
  const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <>
      <div className="grid grid-cols-7 px-1 pb-1 text-center text-[11px] font-bold text-muted-foreground">
        {t.calendar.weekdays.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1 px-1">
        {days.map((day) => {
          const outside = !isSameMonth(day, cursor);
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
    </>
  );
}

function MonthGrid({
  cursor,
  selected,
  min,
  max,
  dateLocale,
  onSelect,
}: {
  cursor: Date;
  selected?: Date;
  min?: Date;
  max?: Date;
  dateLocale: Locale;
  onSelect: (date: Date) => void;
}) {
  const months = Array.from({ length: 12 }, (_, i) => setMonth(startOfYear(cursor), i));

  return (
    <div className="grid grid-cols-3 gap-y-1 px-1 py-1">
      {months.map((m) => {
        const selectedMonth = selected && isSameMonth(m, selected) && isSameYear(m, selected);
        const disabled = (max && startOfMonth(m) > max) || (min && endOfMonth(m) < min);
        return (
          <button
            key={m.toISOString()}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(m)}
            className={cn(
              "mx-auto flex h-9 w-[72px] items-center justify-center rounded-full text-sm font-semibold capitalize transition-colors",
              !selectedMonth && "text-foreground hover:bg-accent",
              selectedMonth && "brand-gradient text-white shadow-glow",
              disabled && "pointer-events-none text-muted-foreground/35",
            )}
          >
            {format(m, "LLL", { locale: dateLocale })}
          </button>
        );
      })}
    </div>
  );
}

function YearGrid({
  years,
  selected,
  min,
  max,
  onSelect,
}: {
  years: number[];
  selected?: Date;
  min?: Date;
  max?: Date;
  onSelect: (date: Date) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-y-1 px-1 py-1">
      {years.map((y) => {
        const yearDate = setYear(new Date(), y);
        const selectedYear = selected && selected.getFullYear() === y;
        const disabled = (max && startOfYear(yearDate) > max) || (min && endOfYear(yearDate) < min);
        return (
          <button
            key={y}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(yearDate)}
            className={cn(
              "mx-auto flex h-9 w-[72px] items-center justify-center rounded-full text-sm font-semibold transition-colors",
              !selectedYear && "text-foreground hover:bg-accent",
              selectedYear && "brand-gradient text-white shadow-glow",
              disabled && "pointer-events-none text-muted-foreground/35",
            )}
          >
            {y}
          </button>
        );
      })}
    </div>
  );
}
