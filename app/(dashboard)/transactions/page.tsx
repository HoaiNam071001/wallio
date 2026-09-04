"use client";

import { useMemo, useState } from "react";
import { NotebookPen, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  TransactionFilterBar,
  type TransactionFilterState,
} from "@/components/transactions/transaction-filter";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionDetailDialog } from "@/components/transactions/transaction-detail-dialog";
import { TodayHero } from "@/components/transactions/today-hero";
import {
  TransactionForm,
  type TransactionFormValues,
} from "@/components/transactions/transaction-form";
import { CategoryBreakdownChart } from "@/components/charts/category-breakdown-chart";
import { ChartTypeToggle } from "@/components/charts/chart-type-toggle";
import { EmptyState } from "@/components/shared/empty-state";
import { AmountText } from "@/components/shared/amount-text";
import { OfflineUnavailable } from "@/components/shared/offline-unavailable";
import {
  useInfiniteTransactions,
  useUpdateTransaction,
  useDeleteTransaction,
} from "@/lib/hooks/use-transactions";
import { useCategoryBreakdown, usePeriodTotals } from "@/lib/hooks/use-summary";
import { useChartType } from "@/lib/hooks/use-chart-type";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { openNewTransactionModal } from "@/lib/hooks/use-new-transaction-modal";
import { getPresetRange, toQueryDate } from "@/lib/utils";
import { useT } from "@/lib/i18n/use-t";
import { SkeletonView } from "@/components/ui/skeleton";
import { transactionRowsSkeleton } from "@/lib/skeleton/shapes";
import type { TransactionWithRelations } from "@/lib/queries/transactions";

const TODAY = toQueryDate(new Date());
const DEFAULT_MONTH_RANGE = getPresetRange("month");

const DEFAULT_FILTER: TransactionFilterState = {
  preset: "month",
  customStart: toQueryDate(DEFAULT_MONTH_RANGE.start),
  customEnd: toQueryDate(DEFAULT_MONTH_RANGE.end),
  accountId: "",
  categoryId: "",
  search: "",
};

export default function TransactionsPage() {
  const { t } = useT();
  const online = useOnlineStatus();
  const [filter, setFilter] = useState<TransactionFilterState>(DEFAULT_FILTER);
  const [breakdownKind, setBreakdownKind] = useState<"expense" | "income">("expense");
  const [chartType, setChartType] = useChartType("transactions");
  const [viewing, setViewing] = useState<TransactionWithRelations | null>(null);
  const [editing, setEditing] = useState<TransactionWithRelations | null>(null);
  const [deleting, setDeleting] = useState<TransactionWithRelations | null>(null);

  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  // DateRangeFilter luôn giữ customStart/customEnd khớp với preset đang chọn (kể cả sau khi
  // bấm nút prev/next điều hướng sang kỳ khác), nên chỉ cần đọc thẳng hai mốc này.
  const startDate = filter.customStart;
  const endDate = filter.customEnd;

  const { data: todayTotals, isLoading: loadingToday } = usePeriodTotals(TODAY, TODAY);
  const { data: periodTotals } = usePeriodTotals(startDate, endDate);
  const { data: breakdown } = useCategoryBreakdown(startDate, endDate, breakdownKind);

  const {
    data: transactionPages,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteTransactions({
    startDate,
    endDate,
    accountId: filter.accountId || undefined,
    categoryId: filter.categoryId || undefined,
    search: filter.search || undefined,
  });
  const transactions = useMemo(() => transactionPages?.pages.flat() ?? [], [transactionPages]);
  const rowsShape = useMemo(() => transactionRowsSkeleton(5), []);

  if (!online) {
    return (
      <div className="flex flex-col gap-4">
        <OfflineUnavailable />
      </div>
    );
  }

  function handleUpdate(values: TransactionFormValues) {
    if (!editing) return;
    updateTransaction.mutate(
      {
        id: editing.id,
        input: {
          ...values,
          category_id: values.category_id ?? null,
          to_account_id: values.to_account_id ?? null,
          to_amount: values.to_amount ?? null,
        },
      },
      {
        onSuccess: () => {
          toast.success(t("transactions.page.toastUpdated"));
          setEditing(null);
        },
        onError: () => toast.error(t("common.genericError")),
      },
    );
  }

  function handleDelete() {
    if (!deleting) return;
    deleteTransaction.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(t("transactions.page.toastDeleted"));
        setDeleting(null);
      },
      onError: () => toast.error(t("common.genericError")),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <TodayHero
        income={todayTotals?.income ?? 0}
        expense={todayTotals?.expense ?? 0}
        loading={loadingToday}
      />

      <TransactionFilterBar value={filter} onChange={setFilter} />

      {/* Tổng quan kỳ đang xem + cơ cấu theo danh mục gộp chung 1 card cho gọn */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t("transactions.page.categoryBreakdownTitle")}</CardTitle>
          <div className="flex items-center gap-1.5">
            <ChartTypeToggle value={chartType} onChange={setChartType} />
            <Tabs
              value={breakdownKind}
              onValueChange={(v) => setBreakdownKind(v as "expense" | "income")}
            >
              <TabsList className="h-9">
                <TabsTrigger value="expense" className="text-xs">
                  {t("transactions.page.expense")}
                </TabsTrigger>
                <TabsTrigger value="income" className="text-xs">
                  {t("transactions.page.income")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {periodTotals && (
            <div className="grid grid-cols-3 gap-1 overflow-hidden">
              {[
                { label: t("transactions.page.income"), value: periodTotals.income, className: "text-income" },
                { label: t("transactions.page.expense"), value: periodTotals.expense, className: "text-expense" },
                {
                  label: t("transactions.page.remaining"),
                  value: periodTotals.net,
                  className: periodTotals.net >= 0 ? "text-income" : "text-expense",
                },
              ].map((item) => (
                <div key={item.label} className="min-w-0 py-2">
                  <p className="truncate text-[11px] font-semibold text-muted-foreground">{item.label}</p>
                  <AmountText
                    amount={item.value}
                    scope="transactions"
                    className={`block text-[13px] font-extrabold tabular-nums sm:text-sm ${item.className}`}
                  />
                </div>
              ))}
            </div>
          )}
          <CategoryBreakdownChart data={breakdown ?? []} scope="transactions" variant={chartType} />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t("transactions.page.recorded")}</h2>
        <Button size="sm" onClick={openNewTransactionModal}>
          <Plus className="size-4" />
          {t("transactions.page.newEntry")}
        </Button>
      </div>

      {isLoading ? (
        <SkeletonView loading instance={rowsShape} />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title={t("transactions.page.emptyTitle")}
          description={t("transactions.page.emptyDescription")}
          action={
            <Button onClick={openNewTransactionModal}>
              <Plus className="size-4" />
              {t("transactions.page.newEntry")}
            </Button>
          }
        />
      ) : (
        <>
          <TransactionList
            transactions={transactions}
            scope="transactions"
            onView={setViewing}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
          {hasNextPage && (
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="self-center"
            >
              {isFetchingNextPage ? t("transactions.page.loadingMore") : t("transactions.page.loadMore")}
            </Button>
          )}
        </>
      )}

      <TransactionDetailDialog
        transaction={viewing}
        scope="transactions"
        open={!!viewing}
        onOpenChange={(open) => !open && setViewing(null)}
        onEdit={() => {
          setEditing(viewing);
          setViewing(null);
        }}
        onDelete={() => {
          setDeleting(viewing);
          setViewing(null);
        }}
      />

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("transactions.page.editTitle")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <TransactionForm
              defaultValues={editing}
              onSubmit={handleUpdate}
              submitting={updateTransaction.isPending}
              className="min-h-0 flex-1"
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("transactions.page.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("transactions.page.deleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
