"use client";

import { useMemo, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAccountsWithBalance } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { useImportWallioCsv, type ImportAccountInput } from "@/lib/hooks/use-csv-import";
import { useT } from "@/lib/i18n/use-t";
import { formatCurrency } from "@/lib/utils";
import {
  parseWallioExportCsv,
  type ParsedCategory,
  type ParsedTransaction,
} from "@/lib/utils/csv-import";

interface AccountRow {
  sourceId: string;
  name: string;
  type: ImportAccountInput["type"];
  unit: string | null;
  initialBalance: number;
  currentBalance: number | null;
  selected: boolean;
  mapping: "new" | { existingAccountId: string };
}

interface TransactionRow extends ParsedTransaction {
  selected: boolean;
}

export function CsvImportDialog() {
  const { t } = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [accountRows, setAccountRows] = useState<AccountRow[]>([]);
  const [transactionRows, setTransactionRows] = useState<TransactionRow[]>([]);
  const [categories, setCategories] = useState<ParsedCategory[]>([]);

  const { data: existingAccounts } = useAccountsWithBalance();
  const { data: existingCategories } = useCategories();
  const importCsv = useImportWallioCsv();

  const accountSelectedMap = useMemo(
    () => new Map(accountRows.map((a) => [a.sourceId, a.selected])),
    [accountRows],
  );

  function isEffectiveSelected(row: TransactionRow): boolean {
    if (!row.resolvable || !row.selected) return false;
    if (!accountSelectedMap.get(row.accountSourceId)) return false;
    if (row.type === "transfer" && row.toAccountSourceId && !accountSelectedMap.get(row.toAccountSourceId)) {
      return false;
    }
    return true;
  }

  function accountLabel(sourceId: string | null): string {
    if (!sourceId) return "—";
    return accountRows.find((a) => a.sourceId === sourceId)?.name ?? "—";
  }

  function netEffectFor(sourceId: string): number {
    let sum = 0;
    for (const row of transactionRows) {
      if (!isEffectiveSelected(row)) continue;
      if (row.accountSourceId === sourceId) {
        sum += row.type === "income" ? row.amount : -row.amount;
      }
      if (row.toAccountSourceId === sourceId && row.type === "transfer") {
        sum += row.toAmount ?? row.amount;
      }
    }
    return sum;
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseWallioExportCsv(text);
      setAccountRows(
        parsed.accounts.map((a) => ({
          ...a,
          selected: true,
          mapping: "new" as const,
        })),
      );
      setTransactionRows(parsed.transactions.map((t) => ({ ...t, selected: true })));
      setCategories(parsed.categories);
      setOpen(true);
    } catch {
      toast.error(t("reports.import.invalidFile"));
    }
  }

  function updateAccount(sourceId: string, patch: Partial<AccountRow>) {
    setAccountRows((prev) => prev.map((a) => (a.sourceId === sourceId ? { ...a, ...patch } : a)));
  }

  function toggleTransaction(sourceId: string, selected: boolean) {
    setTransactionRows((prev) => prev.map((t) => (t.sourceId === sourceId ? { ...t, selected } : t)));
  }

  const selectedAccountCount = accountRows.filter((a) => a.selected).length;
  const selectedTransactionCount = transactionRows.filter(isEffectiveSelected).length;

  function handleSubmit() {
    const selectedAccounts = accountRows.filter((a) => a.selected);
    const selectedTransactions = transactionRows.filter(isEffectiveSelected);
    const usedCategorySourceIds = new Set(
      selectedTransactions.map((t) => t.categorySourceId).filter((id): id is string => !!id),
    );

    importCsv.mutate(
      {
        accounts: selectedAccounts.map((a) => ({
          sourceId: a.sourceId,
          name: a.name,
          type: a.type,
          unit: a.unit,
          initialBalance: a.initialBalance,
          mapping: a.mapping,
        })),
        categories: categories.filter((c) => usedCategorySourceIds.has(c.sourceId)),
        transactions: selectedTransactions.map((t) => ({
          sourceId: t.sourceId,
          date: t.date,
          type: t.type,
          amount: t.amount,
          toAmount: t.toAmount,
          accountSourceId: t.accountSourceId,
          toAccountSourceId: t.toAccountSourceId,
          categorySourceId: t.categorySourceId,
          note: t.note,
        })),
        existingCategories: existingCategories ?? [],
      },
      {
        onSuccess: (result) => {
          toast.success(t("reports.import.toastSuccess", { count: result.transactionsCreated }));
          setOpen(false);
        },
        onError: () => toast.error(t("reports.import.toastError")),
      },
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
        <Upload className="size-4" />
        {t("reports.page.importCsv")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("reports.import.dialogTitle")}</DialogTitle>
            <DialogDescription>{t("reports.import.dialogDescription")}</DialogDescription>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-4 pr-1">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-bold text-muted-foreground">
                {t("reports.import.accountsSection")}
              </h3>
              {accountRows.map((row) => {
                const mapping = row.mapping;
                const mappingValue = mapping === "new" ? "new" : mapping.existingAccountId;
                const showReconcile = row.selected && mapping !== "new";
                const existingBalance =
                  mapping !== "new"
                    ? (existingAccounts?.find((a) => a.id === mapping.existingAccountId)?.current_balance ?? 0)
                    : 0;
                const net = netEffectFor(row.sourceId);

                return (
                  <div key={row.sourceId} className="rounded-2xl border border-border/60 p-2.5">
                    <div className="flex items-center gap-2.5">
                      <Checkbox
                        checked={row.selected}
                        onCheckedChange={(v) => updateAccount(row.sourceId, { selected: !!v })}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{row.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t(`accountType.${row.type}.label`)}
                          {row.currentBalance != null && (
                            <> · {t("reports.import.sourceBalance")}: {formatCurrency(row.currentBalance)}</>
                          )}
                        </p>
                      </div>
                      <Select
                        value={mappingValue}
                        onValueChange={(v) =>
                          updateAccount(row.sourceId, {
                            mapping: v === "new" ? "new" : { existingAccountId: v },
                          })
                        }
                        disabled={!row.selected}
                      >
                        <SelectTrigger size="sm" className="w-[150px] shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">{t("reports.import.createNew")}</SelectItem>
                          {existingAccounts?.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {showReconcile && (
                      <p className="mt-1.5 pl-7 text-[11px] text-muted-foreground">
                        {t("reports.import.resultingBalance")}: {formatCurrency(existingBalance)} +{" "}
                        {formatCurrency(net)} = {formatCurrency(existingBalance + net)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-sm font-bold text-muted-foreground">
                {t("reports.import.transactionsSection")}
              </h3>
              <div className="flex flex-col gap-1 rounded-2xl border border-border/60 p-1.5">
                {transactionRows.map((row) => {
                  const effective = isEffectiveSelected(row);
                  return (
                    <div
                      key={row.sourceId}
                      className={`flex items-center gap-2 rounded-xl px-1.5 py-1.5 ${
                        effective ? "" : "opacity-40"
                      }`}
                    >
                      <Checkbox
                        checked={row.selected}
                        disabled={!row.resolvable || !accountSelectedMap.get(row.accountSourceId)}
                        onCheckedChange={(v) => toggleTransaction(row.sourceId, !!v)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">
                          {row.type === "transfer"
                            ? `${accountLabel(row.accountSourceId)} → ${accountLabel(row.toAccountSourceId)}`
                            : accountLabel(row.accountSourceId)}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {row.date}
                          {row.note ? ` · ${row.note}` : ""}
                        </p>
                        {!row.resolvable && (
                          <Badge variant="destructive" className="mt-0.5">
                            {t("reports.import.unresolvedWarning")}
                          </Badge>
                        )}
                      </div>
                      <span className="shrink-0 text-xs font-bold tabular-nums">
                        {formatCurrency(row.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </DialogBody>

          <DialogFooter className="items-center gap-3 sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {t("reports.import.selectedSummary", {
                accounts: selectedAccountCount,
                transactions: selectedTransactionCount,
              })}
            </p>
            <Button onClick={handleSubmit} disabled={importCsv.isPending}>
              {importCsv.isPending ? t("reports.import.importing") : t("reports.import.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
