"use client";

import { cn } from "@/lib/utils";
import { ICON_REGISTRY, type IconName } from "@/lib/theme/icons";
import { normalizeColor, withAlpha } from "@/lib/theme/palette";

export function IconPicker({
  value,
  onChange,
  options,
  color,
  className,
}: {
  value?: string | null;
  onChange: (icon: string) => void;
  options: IconName[];
  color?: string | null;
  className?: string;
}) {
  const accent = normalizeColor(color);

  return (
    <div
      className={cn(
        "hide-scrollbar grid max-h-44 grid-cols-6 gap-2 overflow-y-auto rounded-2xl border border-input bg-card/50 p-2.5 sm:grid-cols-8",
        className,
      )}
    >
      {options.map((name) => {
        const Icon = ICON_REGISTRY[name];
        const active = value === name;
        return (
          <button
            key={name}
            type="button"
            aria-label={name}
            aria-pressed={active}
            onClick={() => onChange(name)}
            className={cn(
              "flex aspect-square items-center justify-center rounded-xl transition-all active:scale-90",
              active ? "scale-105" : "bg-muted/60 text-muted-foreground hover:bg-accent",
            )}
            style={active ? { backgroundColor: withAlpha(accent, 0.18), color: accent } : undefined}
          >
            <Icon className="size-5" />
          </button>
        );
      })}
    </div>
  );
}
