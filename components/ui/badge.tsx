import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold w-fit whitespace-nowrap shrink-0 gap-1 [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-500/15 text-brand-700 dark:text-brand-300",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive/15 text-destructive",
        outline: "border-border bg-card/60 text-muted-foreground",
        income: "border-transparent bg-income/15 text-income",
        expense: "border-transparent bg-expense/15 text-expense",
        transfer: "border-transparent bg-transfer/15 text-transfer",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
