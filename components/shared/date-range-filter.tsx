"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { ArrowRight, CalendarRange } from "lucide-react";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useT } from "@/lib/i18n/use-t";
import type { TFunction } from "i18next";
import {
  cn,
  DATE_RANGE_PRESET_ORDER,
  getPresetRange,
  toQueryDate,
  type DateRangePreset,
} from "@/lib/utils";

export interface DateRangeFilterValue {
  preset: DateRangePreset;
  customStart: string;
  customEnd: string;
}

/**
 * Bộ lọc khoảng thời gian dùng chung cho sổ thu chi/báo cáo/tổng quan: một nút gọn hiện
 * lựa chọn hiện tại, bấm vào mở bottom sheet gồm hàng chip preset (Hôm nay/Tuần/Tháng/Năm) +
 * 2 thẻ mốc đầu-cuối + lịch. Chip chỉ *điền sẵn* khoảng ngày vào draft (kể cả lịch), mọi thay
 * đổi chỉ có hiệu lực khi bấm "Áp dụng" — không còn preset "Tuỳ chọn" riêng vì phần chọn ngày
 * giờ luôn hiển thị.
 */
export function DateRangeFilter({
  value,
  onChange,
  className,
}: {
  value: DateRangeFilterValue;
  onChange: (next: DateRangeFilterValue) => void;
  className?: string;
}) {
  const { t, locale } = useT();
  const dateLocale = locale === "en" ? enUS : vi;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => withPresetDates(value));
  const [editingField, setEditingField] = useState<"start" | "end">("start");
  const [cursor, setCursor] = useState<Date>(() => parseISO(withPresetDates(value).customStart));

  function handleOpenChange(next: boolean) {
    if (next) {
      const initial = withPresetDates(value);
      setDraft(initial);
      setEditingField("start");
      setCursor(parseISO(initial.customStart));
    }
    setOpen(next);
  }

  function selectPreset(preset: DateRangePreset) {
    const range = getPresetRange(preset);
    setDraft({
      preset,
      customStart: toQueryDate(range.start),
      customEnd: toQueryDate(range.end),
    });
    setEditingField("start");
    setCursor(range.start);
  }

  function jumpTo(field: "start" | "end") {
    setEditingField(field);
    setCursor(parseISO(field === "start" ? draft.customStart : draft.customEnd));
  }

  /** Sửa tay trên lịch → khoảng ngày không còn khớp preset nào nữa. */
  function pickDate(next: string) {
    if (editingField === "start") {
      setDraft((prev) => ({
        preset: "custom",
        customStart: next,
        customEnd: prev.customEnd < next ? next : prev.customEnd,
      }));
      setEditingField("end");
      setCursor(parseISO(next));
    } else {
      setDraft((prev) => ({
        preset: "custom",
        customStart: prev.customStart,
        customEnd: next < prev.customStart ? prev.customStart : next,
      }));
    }
  }

  function apply() {
    onChange(draft);
    setOpen(false);
  }

  const label = triggerLabel(value, t, dateLocale);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-card/70 px-4 text-sm font-bold transition-colors active:scale-95",
            className,
          )}
        >
          <CalendarRange className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{label}</span>
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("dateRangeFilter.sheetTitle")}</SheetTitle>
        </SheetHeader>

        {/* Hàng chip preset: bấm chỉ điền sẵn mốc đầu/cuối + lịch, chưa submit. */}
        <div className="grid grid-cols-4 gap-1.5">
          {DATE_RANGE_PRESET_ORDER.map((preset) => {
            const active = draft.preset === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => selectPreset(preset)}
                className={cn(
                  "truncate rounded-full border px-1 py-2 text-center text-xs font-bold transition-colors",
                  active
                    ? "border-brand-500 bg-brand-500/15 text-brand-700 dark:text-brand-300"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                {t(`dateRangePreset.${preset}`)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-3">
          {/* Hai thẻ mốc đầu/cuối đủ rộng để hiện trọn ngày (trước đây là 2 pill 1 dòng nên bị cắt "…") */}
          <div className="flex items-stretch gap-2">
            <DateFieldCard
              label={t("dateRangeFilter.from")}
              date={draft.customStart}
              active={editingField === "start"}
              dateLocale={dateLocale}
              onClick={() => jumpTo("start")}
            />
            <ArrowRight className="size-4 shrink-0 self-center text-muted-foreground" />
            <DateFieldCard
              label={t("dateRangeFilter.to")}
              date={draft.customEnd}
              active={editingField === "end"}
              dateLocale={dateLocale}
              onClick={() => jumpTo("end")}
            />
          </div>

          <div className="flex justify-center">
            <Calendar
              value={editingField === "start" ? draft.customStart : draft.customEnd}
              onSelect={pickDate}
              cursor={cursor}
              onCursorChange={setCursor}
              minDate={editingField === "end" ? draft.customStart : undefined}
              maxDate={toQueryDate(new Date())}
              rangeStart={draft.customStart}
              rangeEnd={draft.customEnd}
            />
          </div>
        </div>

        <SheetFooter>
          <Button onClick={apply}>{t("dateRangeFilter.apply")}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** Với preset dựng sẵn, mốc đầu/cuối lưu trong value có thể là của lần chọn "custom" trước đó —
 * quy về đúng khoảng của preset để 2 thẻ ngày và lịch luôn hiện đúng thứ đang lọc. */
function withPresetDates(value: DateRangeFilterValue): DateRangeFilterValue {
  if (value.preset === "custom") return value;
  const range = getPresetRange(value.preset);
  return { ...value, customStart: toQueryDate(range.start), customEnd: toQueryDate(range.end) };
}

/** Thẻ chọn mốc đầu/cuối: nhãn ở dòng trên, ngày to ở giữa, thứ ở dòng dưới — bấm để
 * chuyển lịch sang chỉnh mốc đó. */
function DateFieldCard({
  label,
  date,
  active,
  dateLocale,
  onClick,
}: {
  label: string;
  date: string;
  active: boolean;
  dateLocale: Locale;
  onClick: () => void;
}) {
  const parsed = parseISO(date);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-0.5 rounded-2xl border px-3 py-2.5 text-left transition-colors",
        active ? "border-brand-500 bg-brand-500/10" : "border-border bg-card/40 hover:bg-accent",
      )}
    >
      <span
        className={cn(
          "text-[11px] font-bold uppercase tracking-wide",
          active ? "text-brand-700 dark:text-brand-300" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span className="text-base font-extrabold tabular-nums text-foreground">
        {format(parsed, "dd/MM/yyyy", { locale: dateLocale })}
      </span>
      <span className="truncate text-[11px] font-semibold capitalize text-muted-foreground">
        {format(parsed, "EEEE", { locale: dateLocale })}
      </span>
    </button>
  );
}

function formatDraftDate(value: string, dateLocale: Locale): string {
  return format(parseISO(value), "dd/MM/yyyy", { locale: dateLocale });
}

function triggerLabel(value: DateRangeFilterValue, t: TFunction, dateLocale: Locale): string {
  const now = new Date();
  switch (value.preset) {
    case "today":
      return t("dateRangePreset.today");
    case "week":
      return t("dateRangePreset.week");
    case "month":
      return format(now, "MMMM yyyy", { locale: dateLocale });
    case "year":
      return format(now, "yyyy", { locale: dateLocale });
    case "custom":
      return `${formatDraftDate(value.customStart, dateLocale)} → ${formatDraftDate(value.customEnd, dateLocale)}`;
  }
}

type Locale = typeof vi;
