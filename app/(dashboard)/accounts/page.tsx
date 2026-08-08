"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Check, Plus, WalletMinimal } from "lucide-react";
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
import { AccountReorderList } from "@/components/accounts/account-reorder-list";
import { BalanceAdjustDialog } from "@/components/accounts/balance-adjust-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AmountText } from "@/components/shared/amount-text";
import { SkeletonView } from "@/components/ui/skeleton";
import { accountCardsSkeleton } from "@/lib/skeleton/shapes";
import { useAuth } from "@/lib/hooks/use-auth";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import {
  useAccountsWithBalance,
  useCreateAccount,
  useDeleteAccount,
  useReorderAccounts,
  useUpdateAccount,
} from "@/lib/hooks/use-accounts";
import { useT } from "@/lib/i18n/use-t";
import type { AccountWithBalance } from "@/lib/types/database.types";

const LIQUID_TYPES = new Set(["cash", "ewallet", "bank"]);

export default function AccountsPage() {
  const { t } = useT();
  const { user } = useAuth();
  const online = useOnlineStatus();
  const { data: accounts, isLoading } = useAccountsWithBalance();
  const cardsShape = useMemo(() => accountCardsSkeleton(4), []);
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const reorderAccounts = useReorderAccounts();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AccountWithBalance | null>(null);
  const [deleting, setDeleting] = useState<AccountWithBalance | null>(null);
  const [adjusting, setAdjusting] = useState<AccountWithBalance | null>(null);
  const [reordering, setReordering] = useState(false);

  const total = useMemo(
    () =>
      (accounts ?? [])
        .filter((a) => LIQUID_TYPES.has(a.type))
        .reduce((sum, a) => sum + a.current_balance, 0),
    [accounts],
  );

  /** Chặn các hành động ghi khi offline — accounts chỉ đọc từ cache, chưa nằm trong hàng đợi sync. */
  function guardOnline(): boolean {
    if (online) return true;
    toast.error(t("common.offlineActionBlocked"));
    return false;
  }

  function openCreate() {
    if (!guardOnline()) return;
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(account: AccountWithBalance) {
    if (!guardOnline()) return;
    setEditing(account);
    setFormOpen(true);
  }

  function handleSubmit(values: AccountFormValues) {
    if (editing) {
      updateAccount.mutate(
        { id: editing.id, input: values },
        {
          onSuccess: () => {
            toast.success(t("accounts.page.toastUpdated"));
            setFormOpen(false);
          },
          onError: () => toast.error(t("common.genericError")),
        },
      );
      return;
    }

    if (!user) return;
    createAccount.mutate(
      { ...values, user_id: user.id },
      {
        onSuccess: () => {
          toast.success(t("accounts.page.toastAdded"));
          setFormOpen(false);
        },
        onError: () => toast.error(t("common.genericError")),
      },
    );
  }

  function handleDelete() {
    if (!deleting) return;
    deleteAccount.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(t("accounts.page.toastDeleted"));
        setDeleting(null);
      },
      onError: () => {
        toast.error(t("accounts.page.toastDeleteError"));
        setDeleting(null);
      },
    });
  }

  function toggleReorder() {
    if (!reordering && !guardOnline()) return;
    setReordering((prev) => !prev);
  }

  function handleOrderChange(orderedIds: string[]) {
    reorderAccounts.mutate(orderedIds, {
      onError: () => toast.error(t("common.genericError")),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t("accounts.page.title")}
        subtitle={
          <span className="flex items-center gap-1">
            {t("accounts.page.availableCash")}: <AmountText amount={total} scope="accounts" />
          </span>
        }
        amountScope="accounts"
        action={
          reordering ? (
            <Button onClick={toggleReorder} size="sm">
              <Check className="size-4" />
              {t("accounts.page.doneReorder")}
            </Button>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {accounts && accounts.length > 1 && (
                <Button onClick={toggleReorder} size="sm" variant="outline">
                  <ArrowUpDown className="size-4" />
                  {t("accounts.page.reorder")}
                </Button>
              )}
              <Button onClick={openCreate} size="sm">
                <Plus className="size-4" />
                {t("common.add")}
              </Button>
            </div>
          )
        }
      />

      {isLoading && <SkeletonView loading instance={cardsShape} />}

      {!isLoading && accounts?.length === 0 && (
        <EmptyState
          icon={WalletMinimal}
          title={t("accounts.page.emptyTitle")}
          description={t("accounts.page.emptyDescription")}
          action={
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              {t("accounts.page.addAccount")}
            </Button>
          }
        />
      )}

      {!isLoading && accounts && accounts.length > 0 && reordering && (
        <AccountReorderList accounts={accounts} onOrderChange={handleOrderChange} />
      )}

      {!isLoading && accounts && !reordering && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={() => openEdit(account)}
              onDelete={() => guardOnline() && setDeleting(account)}
              onAdjust={() => guardOnline() && setAdjusting(account)}
            />
          ))}
        </div>
      )}

      <BalanceAdjustDialog
        account={adjusting}
        open={!!adjusting}
        onOpenChange={(open) => !open && setAdjusting(null)}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("accounts.page.editTitle") : t("accounts.page.addTitle")}</DialogTitle>
          </DialogHeader>
          <AccountForm
            defaultValues={editing ?? undefined}
            onSubmit={handleSubmit}
            submitting={createAccount.isPending || updateAccount.isPending}
            className="min-h-0 flex-1"
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("accounts.page.deleteTitle", { name: deleting?.name ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("accounts.page.deleteDescription")}</AlertDialogDescription>
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
