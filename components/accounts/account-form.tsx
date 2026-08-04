"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ColorPicker } from "@/components/ui/color-picker";
import { IconPicker } from "@/components/ui/icon-picker";
import { EntityIcon } from "@/components/shared/entity-icon";
import { ACCOUNT_TYPE_META, ACCOUNT_TYPE_OPTIONS } from "@/components/accounts/account-type";
import { ACCOUNT_ICON_NAMES, getIcon } from "@/lib/theme/icons";
import { cn } from "@/lib/utils";
import type { Account, AccountType } from "@/lib/types/database.types";

const accountFormSchema = z.object({
  name: z.string().min(1, "Nhập tên nguồn tiền"),
  type: z.enum(["cash", "ewallet", "bank", "lending", "debt", "in_kind", "other"]),
  initial_balance: z.number(),
  unit: z.string().optional(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
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
  const isEditing = !!defaultValues?.id;
  const initialType = defaultValues?.type ?? "cash";

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
      type: initialType,
      initial_balance: Number(defaultValues?.initial_balance ?? 0),
      unit: defaultValues?.unit ?? "",
      icon: defaultValues?.icon ?? ACCOUNT_TYPE_META[initialType].icon,
      color: defaultValues?.color ?? ACCOUNT_TYPE_META[initialType].color,
    },
  });

  const type = watch("type");
  const icon = watch("icon");
  const color = watch("color");
  const name = watch("name");
  const initialBalance = watch("initial_balance");
  const isInKind = type === "in_kind";

  // Khi tạo mới: đổi loại thì gợi ý luôn icon + màu tương ứng.
  useEffect(() => {
    if (isEditing) return;
    setValue("icon", ACCOUNT_TYPE_META[type].icon);
    setValue("color", ACCOUNT_TYPE_META[type].color);
  }, [type, isEditing, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
        <EntityIcon icon={icon} color={color} className="size-12" iconClassName="size-6" />
        <div className="min-w-0">
          <p className="truncate font-bold">{name || "Nguồn tiền mới"}</p>
          <p className="text-xs text-muted-foreground">{ACCOUNT_TYPE_META[type].hint}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Tên nguồn tiền</Label>
        <Input id="name" placeholder="VD: Momo, Tiền mặt, Vietcombank..." {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Loại</Label>
        <div className="grid grid-cols-3 gap-2">
          {ACCOUNT_TYPE_OPTIONS.map((option) => {
            const OptionIcon = getIcon(option.icon);
            const active = type === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue("type", option.value as AccountType)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 text-xs font-semibold transition-all active:scale-95",
                  active
                    ? "border-transparent text-white shadow-soft"
                    : "border-input bg-card/60 text-muted-foreground",
                )}
                style={active ? { backgroundColor: option.color } : undefined}
              >
                <OptionIcon className="size-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {isInKind && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="unit">Đơn vị tính</Label>
          <Input id="unit" placeholder="VD: chỉ, cây, cổ phiếu..." {...register("unit")} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="initial_balance">{isInKind ? "Số lượng ban đầu" : "Số dư ban đầu"}</Label>
        <CurrencyInput
          id="initial_balance"
          allowNegative
          suffix={isInKind ? "" : "đ"}
          value={initialBalance}
          onValueChange={(next) => setValue("initial_balance", next ?? 0)}
        />
        <p className="text-xs text-muted-foreground">
          {type === "debt"
            ? "Khoản nợ: nhập số âm nếu bạn đang nợ (VD: -500.000)."
            : isInKind
              ? "Số lượng đang có trước khi bắt đầu ghi chép, không có giá VNĐ cố định."
              : "Số tiền đang có trước khi bắt đầu ghi chép."}
        </p>
        {errors.initial_balance && (
          <p className="text-sm text-destructive">{errors.initial_balance.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Màu</Label>
        <ColorPicker value={color} onChange={(next) => setValue("color", next)} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Biểu tượng</Label>
        <IconPicker
          value={icon}
          color={color}
          options={ACCOUNT_ICON_NAMES}
          onChange={(next) => setValue("icon", next)}
        />
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="mt-1">
        {submitting ? "Đang lưu..." : "Lưu"}
      </Button>
    </form>
  );
}
