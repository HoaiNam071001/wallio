"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, UserCog } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrandMark } from "@/components/layout/brand-mark";
import { useAuth } from "@/lib/hooks/use-auth";
import { useSupabase } from "@/lib/hooks/use-supabase";
import { clearPinUnlocked } from "@/lib/utils/pin";

export function Topbar() {
  const { user } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();

  async function handleSignOut() {
    clearPinUnlocked();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-white/40 bg-white/60 px-4 backdrop-blur-xl md:justify-end dark:border-white/10 dark:bg-white/5">
      <Link href="/transactions" className="flex items-center gap-2 md:hidden">
        <BrandMark size={32} />
        <span className="text-lg font-extrabold tracking-tight">Wallio</span>
      </Link>

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
            <Link href="/profile">
              <UserCog className="size-4" />
              Hồ sơ
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOut className="size-4" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
