"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Moon, Sun, User as UserIcon, UserCog } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/hooks/use-auth";
import { useSupabase } from "@/lib/hooks/use-supabase";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useTheme } from "@/lib/hooks/use-theme";
import { clearPinUnlocked } from "@/lib/utils/pin";
import { ROUTES } from "@/lib/constants/routes";

export function Topbar() {
  const { user } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();
  const { t } = useTranslation();
  const [theme, setTheme] = useTheme();
  const isDark = theme === "dark";

  async function handleSignOut() {
    clearPinUnlocked();
    await supabase.auth.signOut();
    router.replace(ROUTES.login);
    router.refresh();
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <header className="sticky top-0 z-30 hidden h-16 items-center justify-end gap-3 border-b border-white/40 bg-white/60 px-4 backdrop-blur-xl md:flex dark:border-white/10 dark:bg-white/5">
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? t.profile.appearance.light : t.profile.appearance.dark}
        className="flex size-9 items-center justify-center rounded-full border border-border bg-card/70 text-muted-foreground transition-colors hover:bg-accent"
      >
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <Avatar className="ring-2 ring-white/70">
              <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email ?? ""} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="flex items-center gap-2 px-3 py-2 text-sm">
            <UserIcon className="size-4 text-muted-foreground" />
            <span className="max-w-[180px] truncate text-muted-foreground">{user?.email}</span>
          </div>
          <DropdownMenuItem asChild>
            <Link href={ROUTES.profile}>
              <UserCog className="size-4" />
              {t.layout.profile}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOut className="size-4" />
            {t.layout.signOut}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
