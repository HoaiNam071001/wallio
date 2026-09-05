import { createElement } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeColor, withAlpha } from "@/lib/theme/palette";

/**
 * Chip icon bo tròn cho "entity có màu riêng" (category, tag, label...):
 * nền = màu của entity pha loãng (alpha thấp), icon/chữ giữ màu gốc.
 * Đổi `getIcon` bằng resolver icon riêng của project (map string -> LucideIcon),
 * hoặc truyền thẳng component icon nếu domain không cần icon tuỳ chỉnh theo tên.
 */
export function EntityIcon({
  icon,
  color,
  fallback,
  className,
  iconClassName,
}: {
  icon?: LucideIcon;
  color?: string | null;
  fallback: LucideIcon;
  className?: string;
  iconClassName?: string;
}) {
  const iconComponent = icon ?? fallback;
  const resolved = normalizeColor(color);

  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset",
        className,
      )}
      style={{
        backgroundColor: withAlpha(resolved, 0.14),
        color: resolved,
        boxShadow: `inset 0 0 0 1px ${withAlpha(resolved, 0.18)}`,
      }}
    >
      {createElement(iconComponent, { className: cn("size-5", iconClassName) })}
    </span>
  );
}
