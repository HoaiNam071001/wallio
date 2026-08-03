import { createElement } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/theme/icons";
import { normalizeColor, withAlpha } from "@/lib/theme/palette";

/** Chip icon bo tròn, nền là màu của danh mục / nguồn tiền pha loãng. */
export function EntityIcon({
  icon,
  color,
  fallback,
  className,
  iconClassName,
}: {
  icon?: string | null;
  color?: string | null;
  fallback?: LucideIcon;
  className?: string;
  iconClassName?: string;
}) {
  // createElement thay vì JSX: icon được tra cứu lúc render nên JSX với biến
  // viết hoa sẽ bị React Compiler cảnh báo "component created during render".
  const iconComponent = getIcon(icon, fallback);
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
