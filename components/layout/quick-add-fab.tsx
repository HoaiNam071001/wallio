"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export function QuickAddFab() {
  return (
    <Link
      href="/transactions/new"
      className="fixed right-4 bottom-20 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 md:bottom-6"
      aria-label="Thêm giao dịch"
    >
      <Plus className="size-6" />
    </Link>
  );
}
