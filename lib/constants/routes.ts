/** Đường dẫn các route trong app — tránh hardcode string rải rác. */
export const ROUTES = {
  home: "/",
  login: "/login",
  authCallback: "/auth/callback",
  dashboard: "/dashboard",
  transactions: "/transactions",
  newTransaction: "/transactions/new",
  accounts: "/accounts",
  /** Chi tiết một nguồn tiền: số dư + dòng tiền vào/ra của riêng nguồn đó. */
  accountDetail: (id: string) => `/accounts/${id}`,
  categories: "/categories",
  reports: "/reports",
  profile: "/profile",
  offline: "/offline",
} as const;

/** Tên các query param dùng trong URL (vd: /auth/callback?code=...&next=...). */
export const ROUTE_PARAMS = {
  code: "code",
  next: "next",
  error: "error",
} as const;
