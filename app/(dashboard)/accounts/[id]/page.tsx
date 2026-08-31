"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkeletonView } from "@/components/ui/skeleton";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { EntityIcon } from "@/components/shared/entity-icon";
import { AmountText, AmountTextForAccount } from "@/components/shared/amount-text";
import { OfflineUnavailable } from "@/components/shared/offline-unavailable";
import { PageHeader } from "@/components/layout/page-header";
import { ACCOUNT_TYPE_META } from "@/components/accounts/account-type";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionDetailDialog } from "@/components/transactions/transaction-detail-dialog";
import { transactionRowsSkeleton } from "@/lib/skeleton/shapes";
import { ROUTES } from "@/lib/constants/routes";
import { useAccountFlowTotals, useAccountsWithBalance } from "@/lib/hooks/use-accounts";
import { useInfiniteTransactions } from "@/lib/hooks/use-transactions";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { normalizeColor, withAlpha } from "@/lib/theme/palette";
import { getPresetRange, toQueryDate, type DateRangePreset } from "@/lib/utils";
import { useT } from "@/lib/i18n/use-t";
import type { AccountFlowDirection } from "@/lib/queries/transactions";
import type { TransactionWithRelations } from "@/lib/queries/transactions";

type FlowTab = "all" | AccountFlowDirection;

/**
 * Chi tiết một nguồn tiền: số dư hiện tại + toàn bộ giao dịch chạm vào nguồn đó, lọc theo chiều
 * tiền (vào / ra / tất cả) và khoảng thời gian. Danh sách để phẳng (không gom theo ngày) vì cuộn
 * vô tận — tiêu đề ngày sẽ bị cắt ngang mỗi lần tải thêm trang.
 */
export default function AccountDetailPage() {
  const { t } = useT();
  const params = useParams<{ id: string }>();
  const accountId = params.id;
  const online = useOnlineStatus();

  const [tab, setTab] = useState<FlowTab>("all");
  const [preset, setPreset] = useState<DateRangePreset>("month");
  const [customStart, setCustomStart] = useState(toQueryDate(new Date()));
  const [customEnd, setCustomEnd] = useState(toQueryDate(new Date()));
  const [viewing, setViewing] = useState<TransactionWithRelations | null>(null);
  const rowsShape = useMemo(() => transactionRowsSkeleton(6), []);

  const { startDate, endDate } = useMemo(() => {
    if (preset === "custom") return { startDate: customStart, endDate: customEnd };
    const range = getPresetRange(preset);
    return { startDate: toQueryDate(range.start), endDate: toQueryDate(range.end) };
  }, [preset, customStart, customEnd]);

  const { data: accounts, isLoading: loadingAccount } = useAccountsWithBalance();
  const account = accounts?.find((a) => a.id === accountId);

  const { data: flow } = useAccountFlowTotals(accountId, startDate, endDate);

  const {
    data: pages,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteTransactions({
    accountId,
    direction: tab === "all" ? undefined : tab,
    startDate,
    endDate,
  });
  const transactions = useMemo(() => pages?.pages.flat() ?? [], [pages]);

  // Cuộn vô tận: nạp trang kế khi ô đánh dấu cuối danh sách sắp lọt vào khung nhìn.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: "240px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!online) {
    return (
      <div className="flex flex-col gap-4">
        <OfflineUnavailable />
      </div>
    );
  }

  const meta = account ? ACCOUNT_TYPE_META[account.type] : ACCOUNT_TYPE_META.other;
  const color = normalizeColor(account?.color ?? meta.color);
  const isDebt = account?.type === "debt";
  const balance = account ? (isDebt ? Math.abs(account.current_balance) : account.current_balance) : 0;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={ROUTES.accounts}
        className="flex w-fit items-center gap-0.5 text-sm font-semibold text-muted-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("accounts.page.title")}
      </Link>

      <PageHeader
        title={account?.name ?? t("accountDetail.title")}
        subtitle={account ? t(`accountType.${account.type}.label`) : undefined}
        amountScope="accounts"
      />

      {!account && !loadingAccount && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("accountDetail.notFound")}
        </p>
      )}

      {account && (
        <Card
          className="overflow-hidden"
          style={{ backgroundImage: `linear-gradient(135deg, ${withAlpha(color, 0.16)}, transparent 65%)` }}
        >
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <EntityIcon
                icon={account.icon ?? meta.icon}
                color={color}
                className="size-12"
                iconClassName="size-6"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">
                  {t("accountDetail.currentBalance")}
                </p>
                <p
                  className={`flex items-center text-2xl font-extrabold tabular-nums ${isDebt ? "text-expense" : ""}`}
                >
                  {isDebt && balance !== 0 ? "-" : ""}
                  <AmountTextForAccount amount={balance} account={account} scope="accounts" />
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-muted-foreground">
                  {t("accountDetail.totalIn")}
                </p>
                <AmountTextForAccount
                  amount={flow?.in ?? 0}
                  account={account}
                  scope="accounts"
                  className="block text-sm font-extrabold text-income tabular-nums"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-muted-foreground">
                  {t("accountDetail.totalOut")}
                </p>
                <AmountTextForAccount
                  amount={flow?.out ?? 0}
                  account={account}
                  scope="accounts"
                  className="block text-sm font-extrabold text-expense tabular-nums"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <DateRangeFilter
          value={{ preset, customStart, customEnd }}
          onChange={(next) => {
            setPreset(next.preset);
            setCustomStart(next.customStart);
            setCustomEnd(next.customEnd);
          }}
          className="flex-1"
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as FlowTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">{t("accountDetail.tabAll")}</TabsTrigger>
          <TabsTrigger value="in">{t("accountDetail.tabIn")}</TabsTrigger>
          <TabsTrigger value="out">{t("accountDetail.tabOut")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <SkeletonView loading instance={rowsShape} />
      ) : (
        <>
          <TransactionList
            transactions={transactions}
            scope="accounts"
            grouped={false}
            onView={setViewing}
            emptyLabel={t("accountDetail.empty")}
          />
          <div ref={sentinelRef} aria-hidden className="h-px" />
          {isFetchingNextPage && (
            <p className="text-center text-sm text-muted-foreground">
              {t("transactions.page.loadingMore")}
            </p>
          )}
        </>
      )}

      <TransactionDetailDialog
        transaction={viewing}
        scope="accounts"
        open={!!viewing}
        onOpenChange={(open) => !open && setViewing(null)}
        editHref={ROUTES.transactions}
      />
    </div>
  );
}
