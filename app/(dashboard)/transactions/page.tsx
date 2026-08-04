"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { ROUTES } from "@/lib/constants/routes";
import {
  TransactionForm,
  type TransactionFormValues,
} from "@/components/transactions/transaction-form";
import { CategoryBreakdownChart } from "@/components/charts/category-breakdown-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { AmountText } from "@/components/shared/amount-text";
import {
  useTransactions,
  useUpdateTransaction,
  useDeleteTransaction,
} from "@/lib/hooks/use-transactions";
import { useCategoryBreakdown, usePeriodTotals } from "@/lib/hooks/use-summary";
import { getPresetRange, toQueryDate } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { TransactionWithRelations } from "@/lib/queries/transactions";

const TODAY = toQueryDate(new Date());

const DEFAULT_FILTER: TransactionFilterState = {
  preset: "month",
  customStart: TODAY,
  customEnd: TODAY,
  accountId: "",
  categoryId: "",
  search: "",
};

export default function TransactionsPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<TransactionFilterState>(DEFAULT_FILTER);
  const [breakdownKind, setBreakdownKind] = useState<"expense" | "income">("expense");
  const [viewing, setViewing] = useState<TransactionWithRelations | null>(null);
  const [editing, setEditing] = useState<TransactionWithRelations | null>(null);
  const [deleting, setDeleting] = useState<TransactionWithRelations | null>(null);

  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const { startDate, endDate } = useMemo(() => {
    if (filter.preset === "custom") {
      return { startDate: filter.customStart, endDate: filter.customEnd };
    }
    const range = getPresetRange(filter.preset);
    return { startDate: toQueryDate(range.start), endDate: toQueryDate(range.end) };
  }, [filter.preset, filter.customStart, filter.customEnd]);

  const { data: todayTotals, isLoading: loadingToday } = usePeriodTotals(TODAY, TODAY);
  const { data: periodTotals } = usePeriodTotals(startDate, endDate);
  const { data: breakdown } = useCategoryBreakdown(startDate, endDate, breakdownKind);

  const { data: transactions, isLoading } = useTransactions({
    startDate,
    endDate,
    accountId: filter.accountId || undefined,
    categoryId: filter.categoryId || undefined,
    search: filter.search || undefined,
  });

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
          toast.success(t.transactions.page.toastUpdated);
          setEditing(null);
        },
        onError: () => toast.error(t.common.genericError),
      },
    );
  }

  function handleDelete() {
    if (!deleting) return;
    deleteTransaction.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(t.transactions.page.toastDeleted);
        setDeleting(null);
      },
      onError: () => toast.error(t.common.genericError),
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

      {/* Tổng quan kỳ đang xem */}
      {periodTotals && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: t.transactions.page.income, value: periodTotals.income, className: "text-income" },
            { label: t.transactions.page.expense, value: periodTotals.expense, className: "text-expense" },
            {
              label: t.transactions.page.remaining,
              value: periodTotals.net,
              className: periodTotals.net >= 0 ? "text-income" : "text-expense",
            },
          ].map((item) => (
            <div key={item.label} className="glass rounded-2xl px-3 py-2.5">
              <p className="text-[11px] font-semibold text-muted-foreground">{item.label}</p>
              <AmountText
                amount={item.value}
                scope="transactions"
                className={`block truncate text-sm font-extrabold tabular-nums ${item.className}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Cơ cấu theo danh mục */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t.transactions.page.categoryBreakdownTitle}</CardTitle>
          <Tabs
            value={breakdownKind}
            onValueChange={(v) => setBreakdownKind(v as "expense" | "income")}
          >
            <TabsList className="h-9">
              <TabsTrigger value="expense" className="text-xs">
                {t.transactions.page.expense}
              </TabsTrigger>
              <TabsTrigger value="income" className="text-xs">
                {t.transactions.page.income}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <CategoryBreakdownChart data={breakdown ?? []} scope="transactions" />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t.transactions.page.recorded}</h2>
        <Button size="sm" asChild>
          <Link href={ROUTES.newTransaction}>
            <Plus className="size-4" />
            {t.transactions.page.newEntry}
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">{t.common.loading}</p>
      ) : transactions?.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title={t.transactions.page.emptyTitle}
          description={t.transactions.page.emptyDescription}
          action={
            <Button asChild>
              <Link href={ROUTES.newTransaction}>
                <Plus className="size-4" />
                {t.transactions.page.newEntry}
              </Link>
            </Button>
          }
        />
      ) : (
        <TransactionList
          transactions={transactions ?? []}
          scope="transactions"
          onView={setViewing}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
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
            <DialogTitle>{t.transactions.page.editTitle}</DialogTitle>
          </DialogHeader>
          {editing && (
            <TransactionForm
              defaultValues={editing}
              onSubmit={handleUpdate}
              submitting={updateTransaction.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.transactions.page.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.transactions.page.deleteDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t.common.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
