"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  TransactionForm,
  type TransactionFormValues,
} from "@/components/transactions/transaction-form";
import { useAuth } from "@/lib/hooks/use-auth";
import { useCreateTransaction } from "@/lib/hooks/use-transactions";
import { ROUTES } from "@/lib/constants/routes";

export default function NewTransactionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const createTransaction = useCreateTransaction();

  function handleSubmit(values: TransactionFormValues) {
    if (!user) return;

    createTransaction.mutate(
      {
        ...values,
        category_id: values.category_id ?? null,
        to_account_id: values.to_account_id ?? null,
        to_amount: values.to_amount ?? null,
        user_id: user.id,
      },
      {
        onSuccess: () => {
          toast.success("Đã lưu vào sổ 🎉");
          router.push(ROUTES.transactions);
        },
        onError: () => toast.error("Có lỗi xảy ra, thử lại sau"),
      },
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Quay lại" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-extrabold">Ghi khoản mới</h1>
      </div>

      <div className="glass rounded-3xl p-4">
        <TransactionForm onSubmit={handleSubmit} submitting={createTransaction.isPending} />
      </div>
    </div>
  );
}
