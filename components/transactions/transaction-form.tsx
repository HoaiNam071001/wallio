"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Transaction, TransactionType } from "@/lib/types/database.types";

const transactionFormSchema = z
  .object({
    type: z.enum(["income", "expense", "transfer"]),
    amount: z.number().positive("Số tiền phải lớn hơn 0"),
    account_id: z.string().min(1, "Chọn nguồn tiền"),
    to_account_id: z.string().optional(),
    category_id: z.string().optional(),
    note: z.string().optional(),
    transaction_date: z.string().min(1, "Chọn ngày"),
  })
  .refine((data) => data.type !== "transfer" || !!data.to_account_id, {
    message: "Chọn nguồn tiền nhận",
    path: ["to_account_id"],
  })
  .refine((data) => data.type !== "transfer" || data.to_account_id !== data.account_id, {
    message: "Nguồn tiền chuyển và nhận phải khác nhau",
    path: ["to_account_id"],
  });

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

const TYPE_LABELS: Record<TransactionType, string> = {
  expense: "Chi tiêu",
  income: "Thu nhập",
  transfer: "Chuyển khoản",
};

export function TransactionForm({
  defaultValues,
  onSubmit,
  submitting,
}: {
  defaultValues?: Partial<Transaction>;
  onSubmit: (values: TransactionFormValues) => void;
  submitting?: boolean;
}) {
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: defaultValues?.type ?? "expense",
      amount: defaultValues?.amount ?? undefined,
      account_id: defaultValues?.account_id ?? "",
      to_account_id: defaultValues?.to_account_id ?? undefined,
      category_id: defaultValues?.category_id ?? undefined,
      note: defaultValues?.note ?? "",
      transaction_date: defaultValues?.transaction_date ?? format(new Date(), "yyyy-MM-dd"),
    },
  });

  const type = watch("type");
  const accountId = watch("account_id");

  const relevantCategories = useMemo(
    () => categories?.filter((c) => c.kind === type) ?? [],
    [categories, type],
  );

  useEffect(() => {
    if (type === "transfer") {
      setValue("category_id", undefined);
    } else {
      setValue("to_account_id", undefined);
    }
  }, [type, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Tabs value={type} onValueChange={(v) => setValue("type", v as TransactionType)}>
        <TabsList className="grid w-full grid-cols-3">
          {(Object.keys(TYPE_LABELS) as TransactionType[]).map((t) => (
            <TabsTrigger key={t} value={t}>
              {TYPE_LABELS[t]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">Số tiền</Label>
        <Input
          id="amount"
          type="number"
          inputMode="decimal"
          step="any"
          placeholder="0"
          autoFocus
          {...register("amount", { valueAsNumber: true })}
        />
        {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label>{type === "transfer" ? "Từ nguồn tiền" : "Nguồn tiền"}</Label>
        <Select value={accountId} onValueChange={(v) => setValue("account_id", v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn nguồn tiền" />
          </SelectTrigger>
          <SelectContent>
            {accounts?.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.account_id && <p className="text-sm text-destructive">{errors.account_id.message}</p>}
      </div>

      {type === "transfer" && (
        <div className="flex flex-col gap-2">
          <Label>Đến nguồn tiền</Label>
          <Select
            value={watch("to_account_id")}
            onValueChange={(v) => setValue("to_account_id", v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn nguồn tiền nhận" />
            </SelectTrigger>
            <SelectContent>
              {accounts
                ?.filter((a) => a.id !== accountId)
                .map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {errors.to_account_id && (
            <p className="text-sm text-destructive">{errors.to_account_id.message}</p>
          )}
        </div>
      )}

      {type !== "transfer" && (
        <div className="flex flex-col gap-2">
          <Label>Danh mục</Label>
          <Select
            value={watch("category_id")}
            onValueChange={(v) => setValue("category_id", v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent>
              {relevantCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="transaction_date">Ngày</Label>
        <Input id="transaction_date" type="date" {...register("transaction_date")} />
        {errors.transaction_date && (
          <p className="text-sm text-destructive">{errors.transaction_date.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="note">Ghi chú</Label>
        <Textarea id="note" placeholder="Ghi chú (tuỳ chọn)" {...register("note")} />
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="mt-2">
        {submitting ? "Đang lưu..." : "Lưu giao dịch"}
      </Button>
    </form>
  );
}
