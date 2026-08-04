"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { CalendarRange, Check } from "lucide-react";
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

  function jumpTo(field: "today" | "start" | "end") {
    if (field === "today") {
      setCursor(new Date());
      return;
    }
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
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => jumpTo("today")}
                  className="shrink-0 rounded-full border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition-colors"
                >
                  {t("common.today")}
                </button>
                <button
                  type="button"
                  onClick={() => jumpTo("start")}
                  className={cn(
                    "min-w-0 flex-1 truncate rounded-full border px-3 py-2 text-xs font-bold transition-colors",
                    editingField === "start"
                      ? "border-transparent bg-brand-500/15 text-brand-700 dark:text-brand-300"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {t("dateRangeFilter.fromDate", { date: formatDraftDate(draft.customStart, dateLocale) })}
                </button>
                <button
                  type="button"
                  onClick={() => jumpTo("end")}
                  className={cn(
                    "min-w-0 flex-1 truncate rounded-full border px-3 py-2 text-xs font-bold transition-colors",
                    editingField === "end"
                      ? "border-transparent bg-brand-500/15 text-brand-700 dark:text-brand-300"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {t("dateRangeFilter.toDate", { date: formatDraftDate(draft.customEnd, dateLocale) })}
                </button>
              </div>

              <div className="flex justify-center">
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
                    } else {
                      setDraft((prev) => ({
                        ...prev,
                        customEnd: next < prev.customStart ? prev.customStart : next,
                      }));
                    }
                  }}
                  cursor={cursor}
                  onCursorChange={setCursor}
                  maxDate={toQueryDate(new Date())}
                />
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
