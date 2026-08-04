"use client";

import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import { useT } from "@/lib/i18n/use-t";
import { openNewTransactionModal } from "@/lib/hooks/use-new-transaction-modal";

export function QuickAddFab() {
  const pathname = usePathname();
  const { t } = useT();

  // Đang ở chính màn hình ghi khoản mới (deep-link) thì không cần nút nổi.
  if (pathname.startsWith(ROUTES.newTransaction)) return null;

  return (
    <button
      type="button"
      onClick={openNewTransactionModal}
      className="brand-gradient fixed right-4 bottom-24 z-40 flex size-14 items-center justify-center rounded-full text-white shadow-glow transition-transform active:scale-90 md:right-6 md:bottom-6"
      aria-label={t("layout.newEntry")}
    >
      <Plus className="size-7" strokeWidth={2.5} />
    </button>
  );
}
