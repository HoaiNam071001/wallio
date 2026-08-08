"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { EntityIcon } from "@/components/shared/entity-icon";
import { AmountTextForAccount } from "@/components/shared/amount-text";
import { ACCOUNT_TYPE_META } from "@/components/accounts/account-type";
import { normalizeColor } from "@/lib/theme/palette";
import { useT } from "@/lib/i18n/use-t";
import type { AccountWithBalance } from "@/lib/types/database.types";

/**
 * Danh sách gọn kiểu Momo để kéo-thả sắp xếp lại nguồn tiền. Chỉ kéo được qua tay cầm (GripVertical)
 * — không phải cả dòng — để không đụng với cuộn trang trên mobile.
 */
export function AccountReorderList({
  accounts,
  onOrderChange,
}: {
  accounts: AccountWithBalance[];
  onOrderChange: (orderedIds: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = accounts.findIndex((a) => a.id === active.id);
    const newIndex = accounts.findIndex((a) => a.id === over.id);
    const next = arrayMove(accounts, oldIndex, newIndex);
    onOrderChange(next.map((a) => a.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={accounts.map((a) => a.id)} strategy={verticalListSortingStrategy}>
        <div className="glass flex flex-col divide-y divide-white/40 overflow-hidden rounded-xl dark:divide-white/10">
          {accounts.map((account) => (
            <AccountReorderRow key={account.id} account={account} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function AccountReorderRow({ account }: { account: AccountWithBalance }) {
  const { t } = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: account.id,
  });
  const meta = ACCOUNT_TYPE_META[account.type];
  const color = normalizeColor(account.color ?? meta.color);
  const isDebt = account.type === "debt";
  const displayBalance = isDebt ? Math.abs(account.current_balance) : account.current_balance;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 bg-transparent p-3 ${isDragging ? "relative z-10 opacity-90" : ""}`}
    >
      <EntityIcon icon={account.icon ?? meta.icon} color={color} className="size-9" iconClassName="size-4.5" />
      <p className="min-w-0 flex-1 truncate text-sm font-bold">{account.name}</p>
      <p className={`shrink-0 text-sm font-bold tabular-nums ${isDebt ? "text-expense" : ""}`}>
        {isDebt && displayBalance !== 0 ? "-" : ""}
        <AmountTextForAccount amount={displayBalance} account={account} scope="accounts" />
      </p>
      <button
        type="button"
        aria-label={t("accounts.page.dragHandle")}
        className="-mr-1 flex size-8 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4.5" />
      </button>
    </div>
  );
}
