"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/lib/hooks/use-supabase";
import { useT } from "@/lib/i18n/use-t";
import { clearPinUnlocked } from "@/lib/utils/pin";
import { ROUTES } from "@/lib/constants/routes";

export function Sidebar() {
  const pathname = usePathname();
  const supabase = useSupabase();
  const router = useRouter();
  const { t } = useT();

  async function handleSignOut() {
    clearPinUnlocked();
    await supabase.auth.signOut();
    router.replace(ROUTES.login);
    router.refresh();
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/40 bg-white/45 backdrop-blur-xl md:flex dark:border-white/10 dark:bg-white/5">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <BrandMark size={36} />
        <span className="text-lg font-extrabold tracking-tight">Wallio</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all",
                active
                  ? "brand-gradient text-white shadow-glow"
                  : "text-muted-foreground hover:bg-white/70 hover:text-foreground dark:hover:bg-white/10",
              )}
            >
              <Icon className="size-4.5" />
              {t(`nav.${item.navKey}.label`)}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 p-3">
        <Link
          href={ROUTES.profile}
          className={cn(
            "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all",
            pathname.startsWith(ROUTES.profile)
              ? "brand-gradient text-white shadow-glow"
              : "text-muted-foreground hover:bg-white/70 hover:text-foreground dark:hover:bg-white/10",
          )}
        >
          <UserCog className="size-4.5" />
          {t("layout.profile")}
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground mt-6"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          {t("layout.signOut")}
        </Button>
      </div>
    </aside>
  );
}
