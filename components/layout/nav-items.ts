import { ChartPie, LayoutGrid, NotebookPen, Tags, Wallet } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";

/** Thứ tự này cũng là thứ tự bottom nav trên mobile — "Sổ thu chi" đứng đầu vì là màn hình chính. */
export const NAV_ITEMS = [
  { href: ROUTES.transactions, label: "Sổ thu chi", shortLabel: "Sổ", icon: NotebookPen },
  { href: ROUTES.accounts, label: "Nguồn tiền", shortLabel: "Ví", icon: Wallet },
  { href: ROUTES.categories, label: "Danh mục", shortLabel: "Danh mục", icon: Tags },
  { href: ROUTES.reports, label: "Báo cáo", shortLabel: "Báo cáo", icon: ChartPie },
  { href: ROUTES.dashboard, label: "Tổng quan", shortLabel: "Tổng quan", icon: LayoutGrid },
] as const;
