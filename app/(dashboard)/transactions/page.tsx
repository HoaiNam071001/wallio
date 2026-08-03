"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { TransactionForm, type TransactionFormValues } from "@/components/transactions/transaction-form";
import { useTransactions, useUpdateTransaction, useDeleteTransaction } from "@/lib/hooks/use-transactions";
import { getPresetRange, toQueryDate } from "@/lib/utils";
import type { TransactionWithRelations } from "@/lib/queries/transactions";

const DEFAULT_FILTER: TransactionFilterState = {
  preset: "month",
  customStart: toQueryDate(new Date()),
  customEnd: toQueryDate(new Date()),
  accountId: "",
  categoryId: "",
  search: "",
};

export default function TransactionsPage() {
  const [filter, setFilter] = useState<TransactionFilterState>(DEFAULT_FILTER);
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
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật giao dịch");
          setEditing(null);
        },
        onError: () => toast.error("Có lỗi xảy ra, thử lại sau"),
      },
    );
  }

  function handleDelete() {
    if (!deleting) return;
    deleteTransaction.mutate(deleting.id, {
      onSuccess: () => {
        toast.success("Đã xoá giao dịch");
        setDeleting(null);
      },
      onError: () => toast.error("Có lỗi xảy ra, thử lại sau"),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Giao dịch</h1>
        <Button asChild>
          <Link href="/transactions/new">
            <Plus className="size-4" />
            Thêm giao dịch
          </Link>
        </Button>
      </div>

      <TransactionFilterBar value={filter} onChange={setFilter} />

      {isLoading ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : (
        <TransactionList
          transactions={transactions ?? []}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa giao dịch</DialogTitle>
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
            <AlertDialogTitle>Xoá giao dịch này?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Xoá</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
