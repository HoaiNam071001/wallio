"use client";

import type { ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAmountVisibility, type AmountVisibilityScope } from "@/lib/hooks/use-amount-visibility";
import { useT } from "@/lib/i18n/use-t";

export function PageHeader({
  title,
  subtitle,
  action,
  amountScope,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  /** Nếu truyền vào, hiện nút ẩn/hiện số tiền riêng cho trang này. */
  amountScope?: AmountVisibilityScope;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {amountScope && <AmountVisibilityToggle scope={amountScope} />}
        {action}
      </div>
    </div>
  );
}

function AmountVisibilityToggle({ scope }: { scope: AmountVisibilityScope }) {
  const [visible, toggle] = useAmountVisibility(scope);
  const { t } = useT();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={visible ? t("common.hideAmount") : t("common.showAmount")}
      className="flex size-9 items-center justify-center rounded-full border border-border bg-card/70 text-muted-foreground transition-colors hover:bg-accent"
    >
      {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
    </button>
  );
}
