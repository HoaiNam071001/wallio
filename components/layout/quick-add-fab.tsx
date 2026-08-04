"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";

export function QuickAddFab() {
  const pathname = usePathname();

  // Đang ở chính màn hình ghi khoản mới thì không cần nút nổi.
  if (pathname.startsWith(ROUTES.newTransaction)) return null;

  return (
    <Link
      href={ROUTES.newTransaction}
      className="brand-gradient fixed right-4 bottom-24 z-40 flex size-14 items-center justify-center rounded-full text-white shadow-glow transition-transform active:scale-90 md:right-6 md:bottom-6"
      aria-label="Ghi khoản mới"
    >
      <Plus className="size-7" strokeWidth={2.5} />
    </Link>
  );
}
