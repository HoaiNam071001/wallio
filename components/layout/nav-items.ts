import { LayoutGrid, NotebookPen, Tags, UserRound, Wallet } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";

/**
 * Nav đầy đủ cho sidebar desktop. Không chứa label/shortLabel — lấy từ
 * t.nav[navKey] vì cần theo ngôn ngữ đang chọn. Báo cáo đã gộp vào Tổng quan
 * nên không còn là mục riêng.
 */
export const NAV_ITEMS = [
  { navKey: "transactions" as const, href: ROUTES.transactions, icon: NotebookPen },
  { navKey: "accounts" as const, href: ROUTES.accounts, icon: Wallet },
  { navKey: "categories" as const, href: ROUTES.categories, icon: Tags },
  { navKey: "dashboard" as const, href: ROUTES.dashboard, icon: LayoutGrid },
];

/** Bottom nav trên mobile — chỉ 3 nút để không bị chật: Sổ, Tổng quan, Tôi. */
export const MOBILE_NAV_ITEMS = [
  { navKey: "transactions" as const, href: ROUTES.transactions, icon: NotebookPen },
  { navKey: "dashboard" as const, href: ROUTES.dashboard, icon: LayoutGrid },
  { navKey: "profile" as const, href: ROUTES.profile, icon: UserRound },
];
