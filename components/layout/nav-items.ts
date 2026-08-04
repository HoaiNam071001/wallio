import { ChartPie, LayoutGrid, NotebookPen, Tags, Wallet } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";

/**
 * Thứ tự này cũng là thứ tự bottom nav trên mobile — "Sổ thu chi" đứng đầu vì là màn hình chính.
 * Không chứa label/shortLabel — lấy từ t.nav[navKey] vì cần theo ngôn ngữ đang chọn.
 */
export const NAV_ITEMS = [
  { navKey: "transactions" as const, href: ROUTES.transactions, icon: NotebookPen },
  { navKey: "accounts" as const, href: ROUTES.accounts, icon: Wallet },
  { navKey: "categories" as const, href: ROUTES.categories, icon: Tags },
  { navKey: "reports" as const, href: ROUTES.reports, icon: ChartPie },
  { navKey: "dashboard" as const, href: ROUTES.dashboard, icon: LayoutGrid },
];
