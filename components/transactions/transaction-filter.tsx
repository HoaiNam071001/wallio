"use client";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { DATE_RANGE_PRESET_LABELS, type DateRangePreset } from "@/lib/utils";

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

  function update<K extends keyof TransactionFilterState>(key: K, val: TransactionFilterState[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="flex flex-col gap-3">
      <Tabs value={value.preset} onValueChange={(v) => update("preset", v as DateRangePreset)}>
        <TabsList className="grid w-full grid-cols-5">
          {(Object.keys(DATE_RANGE_PRESET_LABELS) as DateRangePreset[]).map((preset) => (
            <TabsTrigger key={preset} value={preset} className="text-xs sm:text-sm">
              {DATE_RANGE_PRESET_LABELS[preset]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {value.preset === "custom" && (
        <div className="flex gap-2">
          <Input
            type="date"
            value={value.customStart}
            onChange={(e) => update("customStart", e.target.value)}
          />
          <Input
            type="date"
            value={value.customEnd}
            onChange={(e) => update("customEnd", e.target.value)}
          />
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          value={value.accountId || "all"}
          onValueChange={(v) => update("accountId", v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tất cả nguồn tiền" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả nguồn tiền</SelectItem>
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
            <SelectValue placeholder="Tất cả danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Tìm theo ghi chú..."
          value={value.search}
          onChange={(e) => update("search", e.target.value)}
          className="sm:flex-1"
        />
      </div>
    </div>
  );
}
