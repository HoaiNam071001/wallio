"use client";

import { useMemo, useState } from "react";
import { Plus, WalletMinimal } from "lucide-react";
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
import { BalanceAdjustDialog } from "@/components/accounts/balance-adjust-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useAccountsWithBalance,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from "@/lib/hooks/use-accounts";
import { formatCurrency } from "@/lib/utils";
import type { AccountWithBalance } from "@/lib/types/database.types";

const LIQUID_TYPES = new Set(["cash", "ewallet", "bank"]);

export default function AccountsPage() {
  const { user } = useAuth();
  const { data: accounts, isLoading } = useAccountsWithBalance();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AccountWithBalance | null>(null);
  const [deleting, setDeleting] = useState<AccountWithBalance | null>(null);
  const [adjusting, setAdjusting] = useState<AccountWithBalance | null>(null);

  const total = useMemo(
    () =>
      (accounts ?? [])
        .filter((a) => LIQUID_TYPES.has(a.type))
        .reduce((sum, a) => sum + a.current_balance, 0),
    [accounts],
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(account: AccountWithBalance) {
    setEditing(account);
    setFormOpen(true);
  }

  function handleSubmit(values: AccountFormValues) {
    if (editing) {
      updateAccount.mutate(
        { id: editing.id, input: values },
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
    deleteAccount.mutate(deleting.id, {
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
      <PageHeader
        title="Nguồn tiền"
        subtitle={`Tiền khả dụng: ${formatCurrency(total)}`}
        action={
          <Button onClick={openCreate} size="sm">
            <Plus className="size-4" />
            Thêm
          </Button>
        }
      />

      {isLoading && <p className="text-muted-foreground">Đang tải...</p>}

      {!isLoading && accounts?.length === 0 && (
        <EmptyState
          icon={WalletMinimal}
          title="Chưa có nguồn tiền nào"
          description="Thêm ví, tài khoản ngân hàng hay khoản nợ để bắt đầu theo dõi."
          action={
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Thêm nguồn tiền
            </Button>
          }
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts?.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onEdit={() => openEdit(account)}
            onDelete={() => setDeleting(account)}
            onAdjust={() => setAdjusting(account)}
          />
        ))}
      </div>

      <BalanceAdjustDialog
        account={adjusting}
        open={!!adjusting}
        onOpenChange={(open) => !open && setAdjusting(null)}
      />

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
