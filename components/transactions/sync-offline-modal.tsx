"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSupabase } from "@/lib/hooks/use-supabase";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import {
  usePendingTransactions,
  type PendingTransactionView,
} from "@/lib/hooks/use-pending-transactions";
import { removePendingTransaction } from "@/lib/offline/pending-transactions";
import { createTransaction } from "@/lib/queries/transactions";
import { formatCurrency } from "@/lib/utils";
import { useT } from "@/lib/i18n/use-t";
import type { Locale } from "@/lib/i18n";
import {
  closeSyncOfflineModal,
  useSyncOfflineModalOpen,
} from "@/lib/hooks/use-sync-offline-modal";

const TYPE_ICON = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  transfer: ArrowLeftRight,
} as const;

const TYPE_COLOR = {
  income: "bg-income/14 text-income",
  expense: "bg-expense/14 text-expense",
  transfer: "bg-transfer/14 text-transfer",
} as const;

function SyncRow({
  item,
  checked,
  onToggle,
  locale,
}: {
  item: PendingTransactionView;
  checked: boolean;
  onToggle: () => void;
  locale: Locale;
}) {
  const { t } = useT();
  const Icon = TYPE_ICON[item.input.type];
  const title =
    item.input.type === "transfer"
      ? `${item.accountName} → ${item.toAccountName ?? "?"}`
      : (item.categoryName ?? t("common.uncategorized"));
  const subtitle = item.input.type === "transfer" ? t("common.transfer") : item.accountName;

  return (
    <label className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-accent/40">
      <Checkbox checked={checked} onCheckedChange={onToggle} />
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${TYPE_COLOR[item.input.type]}`}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {subtitle} · {format(parseISO(item.input.transaction_date ?? item.createdAt), "dd/MM/yyyy", {
            locale: locale === "en" ? enUS : vi,
          })}
        </p>
      </span>
      <span className="shrink-0 text-sm font-bold">{formatCurrency(item.input.amount)}</span>
    </label>
  );
}

/**
 * Nội dung modal — mount lại mỗi lần mở (xem `SyncOfflineModal` bên dưới) nên state chọn luôn
 * khởi tạo sạch từ danh sách hiện tại, không cần effect đồng bộ theo `open`.
 */
function SyncOfflineModalBody({ items }: { items: PendingTransactionView[] }) {
  const { t, locale } = useT();
  const supabase = useSupabase();
  const online = useOnlineStatus();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(items.map((item) => item.localId)),
  );
  const [syncing, setSyncing] = useState(false);

  const allSelected = items.length > 0 && selected.size === items.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((item) => item.localId)));
  }

  function toggleOne(localId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(localId)) next.delete(localId);
      else next.add(localId);
      return next;
    });
  }

  async function handleSync() {
    const targets = items.filter((item) => selected.has(item.localId));
    if (targets.length === 0) return;

    setSyncing(true);
    let succeeded = 0;
    for (const item of targets) {
      try {
        await createTransaction(supabase, item.input);
        await removePendingTransaction(item.localId);
        succeeded += 1;
      } catch {
        // giữ lại trong hàng đợi, tính vào phần thất bại
      }
    }
    setSyncing(false);

    if (succeeded === targets.length) {
      toast.success(t("offline.sync.toastSuccess", { count: succeeded }));
      closeSyncOfflineModal();
    } else {
      toast.error(t("offline.sync.toastPartial", { synced: succeeded, total: targets.length }));
    }
  }

  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{t("offline.sync.empty")}</p>;
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleAll}
        className="self-start text-xs font-semibold text-brand-600 hover:underline"
      >
        {allSelected ? t("offline.sync.deselectAll") : t("offline.sync.selectAll")}
      </button>

      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <SyncRow
            key={item.localId}
            item={item}
            checked={selected.has(item.localId)}
            onToggle={() => toggleOne(item.localId)}
            locale={locale}
          />
        ))}
      </div>

      {!online && (
        <p className="text-center text-xs text-muted-foreground">{t("offline.sync.needsNetwork")}</p>
      )}

      <DialogFooter>
        <Button onClick={handleSync} disabled={!online || syncing || selected.size === 0} className="w-full">
          {syncing ? t("common.saving") : t("offline.sync.syncButton", { count: selected.size })}
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * Modal đồng bộ các giao dịch đã ghi khi offline — chọn từng khoản (hoặc chọn hết) rồi đẩy lên
 * Supabase. Mount 1 lần ở layout, mở từ `SyncFab` qua `openSyncOfflineModal()`.
 */
export function SyncOfflineModal() {
  const open = useSyncOfflineModalOpen();
  const { t } = useT();
  const { items } = usePendingTransactions();

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeSyncOfflineModal()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("offline.sync.title")}</DialogTitle>
        </DialogHeader>
        {/* Mount lại mỗi lần mở nên state chọn luôn sạch, không cần effect reset */}
        {open && <SyncOfflineModalBody items={items} />}
      </DialogContent>
    </Dialog>
  );
}
