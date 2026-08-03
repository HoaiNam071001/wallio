"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { AccountCard } from "@/components/accounts/account-card";
import { AccountForm, type AccountFormValues } from "@/components/accounts/account-form";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useAccountBalances,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from "@/lib/hooks/use-accounts";
import type { AccountBalance } from "@/lib/types/database.types";

export default function AccountsPage() {
  const { user } = useAuth();
  const { data: accounts, isLoading } = useAccountBalances();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AccountBalance | null>(null);
  const [deleting, setDeleting] = useState<AccountBalance | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(account: AccountBalance) {
    setEditing(account);
    setFormOpen(true);
  }

  function handleSubmit(values: AccountFormValues) {
    if (editing) {
      updateAccount.mutate(
        { id: editing.account_id, input: values },
        {
          onSuccess: () => {
            toast.success("Đã cập nhật nguồn tiền");
            setFormOpen(false);
          },
          onError: () => toast.error("Có lỗi xảy ra, thử lại sau"),
        },
      );
      return;
    }

    if (!user) return;
    createAccount.mutate(
      { ...values, user_id: user.id },
      {
        onSuccess: () => {
          toast.success("Đã thêm nguồn tiền");
          setFormOpen(false);
        },
        onError: () => toast.error("Có lỗi xảy ra, thử lại sau"),
      },
    );
  }

  function handleDelete() {
    if (!deleting) return;
    deleteAccount.mutate(deleting.account_id, {
      onSuccess: () => {
        toast.success("Đã xoá nguồn tiền");
        setDeleting(null);
      },
      onError: () => {
        toast.error("Không thể xoá — có thể còn giao dịch liên quan");
        setDeleting(null);
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Nguồn tiền</h1>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Thêm nguồn tiền
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Đang tải...</p>}

      {!isLoading && accounts?.length === 0 && (
        <p className="text-muted-foreground">Chưa có nguồn tiền nào. Thêm nguồn tiền đầu tiên của bạn.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts?.map((account) => (
          <AccountCard
            key={account.account_id}
            account={account}
            onEdit={() => openEdit(account)}
            onDelete={() => setDeleting(account)}
          />
        ))}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa nguồn tiền" : "Thêm nguồn tiền"}</DialogTitle>
          </DialogHeader>
          <AccountForm
            defaultValues={editing ?? undefined}
            onSubmit={handleSubmit}
            submitting={createAccount.isPending || updateAccount.isPending}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá nguồn tiền &quot;{deleting?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Nguồn tiền có giao dịch liên quan sẽ không xoá được.
            </AlertDialogDescription>
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
