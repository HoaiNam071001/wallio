import { ChartPie, LayoutGrid, NotebookPen, Tags, Wallet } from "lucide-react";

/** Thứ tự này cũng là thứ tự bottom nav trên mobile — "Sổ thu chi" đứng đầu vì là màn hình chính. */
export const NAV_ITEMS = [
  { href: "/transactions", label: "Sổ thu chi", shortLabel: "Sổ", icon: NotebookPen },
  { href: "/accounts", label: "Nguồn tiền", shortLabel: "Ví", icon: Wallet },
  { href: "/categories", label: "Danh mục", shortLabel: "Danh mục", icon: Tags },
  { href: "/reports", label: "Báo cáo", shortLabel: "Báo cáo", icon: ChartPie },
  { href: "/dashboard", label: "Tổng quan", shortLabel: "Tổng quan", icon: LayoutGrid },
] as const;
