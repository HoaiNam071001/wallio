"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsHandheld } from "@/lib/hooks/use-is-handheld";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

type DateFieldProps = Omit<React.ComponentProps<"input">, "value" | "onChange" | "type" | "size"> & {
  value: string;
  onChange: (value: string) => void;
};

/**
 * Ô chọn ngày, hiển thị dạng đã format (03/08/2026).
 *
 * Trên desktop (chuột): input[type=date] gốc chỉ mở lịch khi bấm trúng icon nhỏ ở rìa —
 * bấm chỗ khác trong ô (nơi người dùng hay bấm) không có phản hồi gì, dễ hiểu lầm là lỗi.
 * Nên desktop dùng lịch tự vẽ trong popover, bấm đâu trên ô cũng mở được.
 *
 * Trên di động (cảm ứng): input native hoạt động tốt — chạm vào là mở thẳng bộ chọn ngày
 * toàn màn hình của hệ điều hành, quen thuộc và mượt hơn lịch tự vẽ nên vẫn giữ nguyên.
 */
export function DateField({ value, onChange, className, id, max, min, ...props }: DateFieldProps) {
  const isHandheld = useIsHandheld();
  const [open, setOpen] = React.useState(false);

  const label = value ? format(parseISO(value), "dd/MM/yyyy", { locale: vi }) : "Chọn ngày";

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

  if (!isHandheld) {
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
        <PopoverContent align="start">
          <Calendar
            value={value}
            maxDate={max as string | undefined}
            minDate={min as string | undefined}
            onSelect={(next) => {
              onChange(next);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className={cn("relative", !value && "text-muted-foreground")}>
      {pill}
      <input
        {...props}
        id={id}
        type="date"
        value={value}
        max={max}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}
