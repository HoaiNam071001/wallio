import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full rounded-2xl border border-input bg-card/70 px-4 py-3 text-base transition-all outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-brand-400 focus-visible:bg-card focus-visible:ring-4 focus-visible:ring-brand-500/15",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
