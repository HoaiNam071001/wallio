import { LayoutDashboard, ArrowLeftRight, Wallet, Tags, PieChart } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/transactions", label: "Giao dịch", icon: ArrowLeftRight },
  { href: "/accounts", label: "Nguồn tiền", icon: Wallet },
  { href: "/categories", label: "Danh mục", icon: Tags },
  { href: "/reports", label: "Báo cáo", icon: PieChart },
] as const;
