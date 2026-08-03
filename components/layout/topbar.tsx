"use client";

import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, Wallet } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/hooks/use-auth";
import { useSupabase } from "@/lib/hooks/use-supabase";

export function Topbar() {
  const { user } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:justify-end">
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Wallet className="size-3.5" />
        </div>
        <span className="font-semibold">Wallio</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <Avatar>
              <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email ?? ""} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
            <UserIcon className="size-4 text-muted-foreground" />
            <span className="max-w-[180px] truncate text-muted-foreground">{user?.email}</span>
          </div>
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOut className="size-4" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
