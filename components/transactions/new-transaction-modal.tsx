"use client";

import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  TransactionForm,
  type TransactionFormValues,
} from "@/components/transactions/transaction-form";
import { useAuth } from "@/lib/hooks/use-auth";
import { useCreateTransaction } from "@/lib/hooks/use-transactions";
import { useT } from "@/lib/i18n/use-t";
import {
  closeNewTransactionModal,
  useNewTransactionModalOpen,
} from "@/lib/hooks/use-new-transaction-modal";

/**
 * Modal "Ghi khoản mới" toàn cục — mount 1 lần ở layout, mở từ bất kỳ đâu (FAB, nút trong
 * trang...) qua `openNewTransactionModal()` thay vì điều hướng sang trang riêng, để không mất
 * ngữ cảnh đang xem. `/transactions/new` vẫn giữ nguyên cho deep-link (vd PWA shortcut).
 */
export function NewTransactionModal() {
  const open = useNewTransactionModalOpen();
  const { t } = useT();
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
          toast.success(t("transactions.new.toastSaved"));
          closeNewTransactionModal();
        },
        onError: () => toast.error(t("common.genericError")),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeNewTransactionModal()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("transactions.new.title")}</DialogTitle>
        </DialogHeader>
        {/* Mount lại mỗi lần mở nên state của form luôn sạch, không cần effect reset */}
        {open && (
          <TransactionForm onSubmit={handleSubmit} submitting={createTransaction.isPending} />
        )}
      </DialogContent>
    </Dialog>
  );
}
