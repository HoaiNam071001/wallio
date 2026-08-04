import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";

export type DateRangePreset = "today" | "week" | "month" | "year" | "custom";

export interface DateRange {
  start: Date;
  end: Date;
}

export function getPresetRange(preset: DateRangePreset, now: Date = new Date()): DateRange {
  switch (preset) {
    case "today":
      return { start: now, end: now };
    case "week":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "year":
      return { start: startOfYear(now), end: endOfYear(now) };
    case "custom":
      return { start: now, end: now };
  }
}

export function toQueryDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

// Thứ tự này quyết định thứ tự hiển thị tab/chip ở Báo cáo và Sổ thu chi —
// đặt "custom" (Tuỳ chọn) lên đầu theo yêu cầu. Nhãn lấy từ t.dateRangePreset vì cần theo ngôn ngữ đang chọn.
export const DATE_RANGE_PRESET_ORDER: DateRangePreset[] = ["custom", "today", "week", "month", "year"];
