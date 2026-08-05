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
import { useT } from "@/lib/i18n/use-t";
import { ROUTES } from "@/lib/constants/routes";

export default function NewTransactionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useT();
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
        onSuccess: (result) => {
          toast.success(
            "queued" in result
              ? t("transactions.new.toastSavedOffline")
              : t("transactions.new.toastSaved"),
          );
          router.push(ROUTES.transactions);
        },
        onError: () => toast.error(t("common.genericError")),
      },
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label={t("transactions.new.backAria")} onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-extrabold">{t("transactions.new.title")}</h1>
      </div>

      <div className="glass rounded-xl p-4">
        <TransactionForm onSubmit={handleSubmit} submitting={createTransaction.isPending} />
      </div>
    </div>
  );
}
