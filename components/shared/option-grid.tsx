"use client";

import { EntityIcon } from "@/components/shared/entity-icon";
import { cn } from "@/lib/utils";
import { normalizeColor, withAlpha } from "@/lib/theme/palette";

export interface OptionGridItem {
  id: string;
  label: string;
  icon?: string | null;
  color?: string | null;
  /** Dòng phụ tuỳ chọn dưới tên (vd số dư của nguồn tiền). */
  hint?: string;
}

/**
 * Lưới ô chọn nhỏ gọn (icon + tên) dùng cho danh mục và nguồn tiền trong form ghi giao dịch:
 * chạm một lần là xong, thay cho dropdown. Tên xuống tối đa 2 dòng thay vì cắt bằng "..." —
 * tên danh mục/nguồn tiền tiếng Việt hay dài hơn bề ngang một ô.
 */
export function OptionGrid({
  items,
  value,
  onSelect,
  className,
}: {
  items: OptionGridItem[];
  value?: string;
  /** Chạm lại ô đang chọn sẽ gọi với `undefined` — cho phép bỏ chọn. */
  onSelect: (id: string | undefined) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-4 gap-1 sm:grid-cols-6", className)}>
      {items.map((item) => {
        const active = value === item.id;
        const color = normalizeColor(item.color);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(active ? undefined : item.id)}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 rounded-2xl px-0.5 py-1.5 transition-all active:scale-95",
            )}
            style={active ? { backgroundColor: withAlpha(color, 0.14) } : undefined}
          >
            <EntityIcon
              icon={item.icon}
              color={item.color}
              className={cn("size-9 rounded-xl", active && "ring-2")}
              iconClassName="size-4"
            />
            <span
              className={cn(
                "line-clamp-2 w-full text-center text-[10px] leading-tight font-semibold break-words",
                active ? "" : "text-muted-foreground",
              )}
              style={active ? { color } : undefined}
            >
              {item.label}
            </span>
            {item.hint && (
              <span className="w-full truncate text-center text-[9px] font-medium text-muted-foreground tabular-nums">
                {item.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
