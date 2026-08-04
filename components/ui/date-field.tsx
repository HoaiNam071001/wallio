"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsHandheld } from "@/lib/hooks/use-is-handheld";
import { useT } from "@/lib/i18n/use-t";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";

type DateFieldProps = Omit<React.ComponentProps<"input">, "value" | "onChange" | "type" | "size"> & {
  value: string;
  onChange: (value: string) => void;
};

/**
 * Ô chọn ngày, hiển thị dạng đã format (03/08/2026), dùng chung một lịch tự vẽ
 * (`Calendar`) trên cả desktop và di động để giao diện nhất quán:
 * - Desktop (chuột): lịch mở trong popover, bấm đâu trên ô cũng mở được.
 * - Di động (cảm ứng): lịch mở trong modal toàn màn hình, dễ chạm hơn popover.
 */
export function DateField({ value, onChange, className, id, max, min }: DateFieldProps) {
  const isHandheld = useIsHandheld();
  const { t, locale } = useT();
  const [open, setOpen] = React.useState(false);

  const label = value
    ? format(parseISO(value), "dd/MM/yyyy", { locale: locale === "en" ? enUS : vi })
    : t("common.chooseDate");

  const pill = (
    <div
      className={cn(
        "flex h-10 w-full items-center gap-2 rounded-full border border-input bg-card/70 px-3 text-sm font-semibold",
        className,
      )}
    >
      <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
      <span className={cn("truncate", !value && "font-normal text-muted-foreground")}>{label}</span>
    </div>
  );

  const calendar = (
    <Calendar
      value={value}
      maxDate={max as string | undefined}
      minDate={min as string | undefined}
      onSelect={(next) => {
        onChange(next);
        setOpen(false);
      }}
    />
  );

  if (isHandheld) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <button
          type="button"
          id={id}
          onClick={() => setOpen(true)}
          className="w-full cursor-pointer rounded-full outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15"
        >
          {pill}
        </button>
        <DialogContent className="w-auto max-w-[calc(100%-2rem)] p-4">
          <DialogHeader className="sr-only">
            <DialogTitle>{t("common.chooseDate")}</DialogTitle>
          </DialogHeader>
          <div className="mt-8">
             {calendar}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          className="w-full cursor-pointer rounded-full outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15"
        >
          {pill}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start">{calendar}</PopoverContent>
    </Popover>
  );
}
