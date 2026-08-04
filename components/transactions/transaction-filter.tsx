"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { useT } from "@/lib/i18n/use-t";
import { cn, type DateRangePreset } from "@/lib/utils";

export interface TransactionFilterState {
  preset: DateRangePreset;
  customStart: string;
  customEnd: string;
  accountId: string;
  categoryId: string;
  search: string;
}

export function TransactionFilterBar({
  value,
  onChange,
}: {
  value: TransactionFilterState;
  onChange: (next: TransactionFilterState) => void;
}) {
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { t } = useT();
  const [expanded, setExpanded] = useState(false);

  const activeCount = [value.accountId, value.categoryId, value.search].filter(Boolean).length;

  function update<K extends "accountId" | "categoryId" | "search">(
    key: K,
    val: TransactionFilterState[K],
  ) {
    onChange({ ...value, [key]: val });
  }

  function clearExtras() {
    onChange({ ...value, accountId: "", categoryId: "", search: "" });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <DateRangeFilter
          value={{ preset: value.preset, customStart: value.customStart, customEnd: value.customEnd }}
          onChange={(next) => onChange({ ...value, ...next })}
          className="flex-1"
        />

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-label={t("transactions.filter.filterAria")}
          className={cn(
            "relative flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors",
            expanded || activeCount > 0
              ? "border-transparent bg-brand-500/15 text-brand-600"
              : "border-border bg-card/70 text-muted-foreground",
          )}
        >
          <SlidersHorizontal className="size-4" />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {expanded && (
        <div className="glass flex flex-col gap-2 rounded-3xl p-3 sm:flex-row">
          <Select
            value={value.accountId || "all"}
            onValueChange={(v) => update("accountId", v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t("transactions.filter.allAccounts")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("transactions.filter.allAccounts")}</SelectItem>
              {accounts?.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={value.categoryId || "all"}
            onValueChange={(v) => update("categoryId", v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t("transactions.filter.allCategories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("transactions.filter.allCategories")}</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative sm:flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("transactions.filter.searchPlaceholder")}
              value={value.search}
              onChange={(e) => update("search", e.target.value)}
              className="pl-10"
            />
          </div>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearExtras}
              className="flex items-center justify-center gap-1 rounded-full px-3 py-2 text-xs font-bold text-muted-foreground"
            >
              <X className="size-3.5" />
              {t("transactions.filter.clearFilters")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
