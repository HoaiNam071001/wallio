"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACCOUNT_TYPE_OPTIONS } from "@/components/accounts/account-type";
import type { Account } from "@/lib/types/database.types";

const accountFormSchema = z.object({
  name: z.string().min(1, "Nhập tên nguồn tiền"),
  type: z.enum(["cash", "ewallet", "bank", "lending", "debt", "other"]),
  initial_balance: z.number(),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;

export function AccountForm({
  defaultValues,
  onSubmit,
  submitting,
}: {
  defaultValues?: Partial<Account>;
  onSubmit: (values: AccountFormValues) => void;
  submitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "cash",
      initial_balance: defaultValues?.initial_balance ?? 0,
    },
  });

  const type = watch("type");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Tên nguồn tiền</Label>
        <Input id="name" placeholder="VD: Momo, Tiền mặt, Vietcombank..." {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Loại</Label>
        <Select value={type} onValueChange={(v) => setValue("type", v as AccountFormValues["type"])}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="initial_balance">Số dư ban đầu</Label>
        <Input
          id="initial_balance"
          type="number"
          step="any"
          {...register("initial_balance", { valueAsNumber: true })}
        />
        {errors.initial_balance && (
          <p className="text-sm text-destructive">{errors.initial_balance.message}</p>
        )}
      </div>

      <Button type="submit" disabled={submitting} className="mt-2">
        {submitting ? "Đang lưu..." : "Lưu"}
      </Button>
    </form>
  );
}
