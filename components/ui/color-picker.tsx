"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLOR_SWATCHES, normalizeColor } from "@/lib/theme/palette";

export function ColorPicker({
  value,
  onChange,
  className,
}: {
  value?: string | null;
  onChange: (color: string) => void;
  className?: string;
}) {
  const selected = normalizeColor(value);

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {COLOR_SWATCHES.map((swatch) => {
        const active = swatch.value.toLowerCase() === selected.toLowerCase();
        return (
          <button
            key={swatch.value}
            type="button"
            title={swatch.name}
            aria-label={swatch.name}
            aria-pressed={active}
            onClick={() => onChange(swatch.value)}
            className={cn(
              "flex size-9 items-center justify-center rounded-full text-white transition-transform active:scale-90",
              active && "ring-2 ring-offset-2 ring-offset-background",
            )}
            style={{
              backgroundColor: swatch.value,
              ...(active ? { boxShadow: `0 0 0 2px ${swatch.value}` } : {}),
            }}
          >
            {active && <Check className="size-4" strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}
