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

function DebugOverflow() {
  const [text, setText] = useState("");
  useLayoutEffect(() => {
    const w = window.innerWidth;
    const offenders: string[] = [];
    document.querySelectorAll("body *").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > w + 1 && r.width > 0) {
        offenders.push(
          `${el.tagName} cls="${(el as HTMLElement).className.toString().slice(0, 60)}" right=${r.right.toFixed(0)} w=${r.width.toFixed(0)}`,
        );
      }
    });
    const report = `innerWidth=${w} docScrollW=${document.documentElement.scrollWidth} bodyScrollW=${document.body.scrollWidth}\n${offenders.join("\n")}`;
    setText(report);
    // eslint-disable-next-line no-console
    console.log("OVERFLOW_DEBUG_START\n" + report + "\nOVERFLOW_DEBUG_END");
  }, []);
  return (
    <pre className="fixed inset-x-0 top-0 z-[999] max-h-64 overflow-auto bg-yellow-200 p-2 text-[9px] text-black">
      {text}
    </pre>
  );
}

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
          router.push("/transactions");
        },
        onError: () => toast.error("Có lỗi xảy ra, thử lại sau"),
      },
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <DebugOverflow />
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
