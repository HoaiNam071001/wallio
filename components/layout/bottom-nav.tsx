"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/layout/nav-items";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-white/50 bg-white/80 backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-[oklch(0.19_0.03_266)]/85">
      <div className="flex">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-0.5 py-2"
            >
              <span
                className={cn(
                  "flex h-7 w-11 items-center justify-center rounded-full transition-all",
                  active ? "brand-gradient text-white shadow-glow" : "text-muted-foreground",
                )}
              >
                <Icon className="size-4.5" />
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {item.shortLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
