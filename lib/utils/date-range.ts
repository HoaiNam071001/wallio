import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  parseISO,
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

// Thứ tự hàng chip preset trong DateRangeFilter. Không có "custom" ở đây: phần chọn khoảng ngày
// luôn hiển thị sẵn nên "custom" chỉ là *kết quả* khi người dùng tự sửa mốc đầu/cuối, không phải một
// lựa chọn bấm được. Nhãn lấy từ t.dateRangePreset vì cần theo ngôn ngữ đang chọn.
export const DATE_RANGE_PRESET_ORDER: Exclude<DateRangePreset, "custom">[] = ["today", "week", "month", "year"];

export interface QueryDateRange {
  preset: DateRangePreset;
  customStart: string;
  customEnd: string;
}

/**
 * Lùi/tiến một bước cho nút prev/next cạnh DateRangeFilter: "today" đi từng ngày, "week"/"month"/"year"
 * đi theo đúng đơn vị lịch (tuần Thứ 2 → CN, tháng dương lịch, năm dương lịch) chứ không phải cộng/trừ
 * số ngày cố định — để tháng 31 ngày lùi về vẫn ra trọn tháng trước chứ không lệch ngày. "custom" (khoảng
 * ngày tự chọn, không khớp preset nào) thì lấy đúng độ dài đang chọn rồi trượt sang khối ngày liền kề.
 */
export function shiftDateRange(range: QueryDateRange, direction: 1 | -1): QueryDateRange {
  const start = parseISO(range.customStart);
  const end = parseISO(range.customEnd);
  switch (range.preset) {
    case "today": {
      const next = addDays(start, direction);
      return { preset: "today", customStart: toQueryDate(next), customEnd: toQueryDate(next) };
    }
    case "week": {
      const next = addDays(start, direction * 7);
      return {
        preset: "week",
        customStart: toQueryDate(startOfWeek(next, { weekStartsOn: 1 })),
        customEnd: toQueryDate(endOfWeek(next, { weekStartsOn: 1 })),
      };
    }
    case "month": {
      const next = addMonths(start, direction);
      return { preset: "month", customStart: toQueryDate(startOfMonth(next)), customEnd: toQueryDate(endOfMonth(next)) };
    }
    case "year": {
      const next = addYears(start, direction);
      return { preset: "year", customStart: toQueryDate(startOfYear(next)), customEnd: toQueryDate(endOfYear(next)) };
    }
    case "custom": {
      const lengthDays = differenceInCalendarDays(end, start) + 1;
      const delta = lengthDays * direction;
      return {
        preset: "custom",
        customStart: toQueryDate(addDays(start, delta)),
        customEnd: toQueryDate(addDays(end, delta)),
      };
    }
  }
}
