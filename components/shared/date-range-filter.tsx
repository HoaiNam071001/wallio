"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { ArrowRight, CalendarRange, Check } from "lucide-react";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useT } from "@/lib/i18n/use-t";
import type { TFunction } from "i18next";
import {
  cn,
  DATE_RANGE_PRESET_ORDER,
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
 * lựa chọn hiện tại, bấm vào mở bottom sheet chứa danh sách preset + lịch chọn khoảng khi
 * chọn "Tuỳ chọn" — thay cho 3 UI rời rạc (chip cuộn ngang, 2 kiểu Tabs) trước đây.
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
  const [draft, setDraft] = useState(value);
  const [editingField, setEditingField] = useState<"start" | "end">("start");
  const [cursor, setCursor] = useState<Date>(() => parseISO(value.customStart));

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft(value);
      setEditingField("start");
      setCursor(parseISO(value.customStart));
    }
    setOpen(next);
  }

  function jumpTo(field: "start" | "end") {
    setEditingField(field);
    setCursor(parseISO(field === "start" ? draft.customStart : draft.customEnd));
  }

  function commitPreset(preset: DateRangePreset) {
    if (preset === "custom") {
      setDraft((prev) => ({ ...prev, preset }));
      return;
    }
    onChange({ ...value, preset });
    setOpen(false);
  }

  function applyCustom() {
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

        <div className="flex flex-col gap-1">
          {DATE_RANGE_PRESET_ORDER.map((preset) => {
            const active = draft.preset === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => commitPreset(preset)}
                className={cn(
                  "flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                  active ? "bg-brand-500/15 text-brand-700 dark:text-brand-300" : "text-foreground hover:bg-accent",
                )}
              >
                {t(`dateRangePreset.${preset}`)}
                {active && <Check className="size-4" />}
              </button>
            );
          })}
        </div>

        {draft.preset === "custom" && (
          <>
            <div className="flex flex-col gap-3 border-t border-border/60 pt-3">
              {/* Hai thẻ From/To đủ rộng để hiện trọn ngày (trước đây là 2 pill 1 dòng nên bị cắt "…") */}
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

              <div className="flex flex-col items-center gap-1">
                <Calendar
                  value={editingField === "start" ? draft.customStart : draft.customEnd}
                  onSelect={(next) => {
                    if (editingField === "start") {
                      setDraft((prev) => ({
                        ...prev,
                        customStart: next,
                        customEnd: prev.customEnd < next ? next : prev.customEnd,
                      }));
                      setEditingField("end");
                      setCursor(parseISO(next));
                    } else {
                      setDraft((prev) => ({
                        ...prev,
                        customEnd: next < prev.customStart ? prev.customStart : next,
                      }));
                    }
                  }}
                  cursor={cursor}
                  onCursorChange={setCursor}
                  minDate={editingField === "end" ? draft.customStart : undefined}
                  maxDate={toQueryDate(new Date())}
                  rangeStart={draft.customStart}
                  rangeEnd={draft.customEnd}
                />
                <button
                  type="button"
                  onClick={() => setCursor(new Date())}
                  className="rounded-full px-3 py-1 text-xs font-bold text-muted-foreground transition-colors hover:bg-accent"
                >
                  {t("common.today")}
                </button>
              </div>
            </div>

            <SheetFooter>
              <Button onClick={applyCustom}>{t("dateRangeFilter.apply")}</Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
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
