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
import { ACCOUNT_TYPE_META, accountTypeOptions } from "@/components/accounts/account-type";
import { ACCOUNT_ICON_NAMES, getIcon } from "@/lib/theme/icons";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/use-t";
import type { Account, AccountType } from "@/lib/types/database.types";

const accountFormSchema = z.object({
  name: z.string().min(1),
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
  className,
}: {
  defaultValues?: Partial<Account>;
  onSubmit: (values: AccountFormValues) => void;
  submitting?: boolean;
  /** Truyền "min-h-0 flex-1" khi đặt trong modal có chiều cao giới hạn — xem TransactionForm. */
  className?: string;
}) {
  const { t } = useT();
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
    <form onSubmit={handleSubmit(onSubmit)} className={cn("flex min-h-0 flex-col gap-4", className)}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
          <EntityIcon icon={icon} color={color} className="size-12" iconClassName="size-6" />
          <div className="min-w-0">
            <p className="truncate font-bold">{name || t("accounts.form.newAccountName")}</p>
            <p className="text-xs text-muted-foreground">{t(`accountType.${type}.hint`)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="name">{t("accounts.form.nameLabel")}</Label>
          <Input id="name" placeholder={t("accounts.form.namePlaceholder")} {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{t("accounts.form.validation.nameRequired")}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t("accounts.form.typeLabel")}</Label>
          <div className="grid grid-cols-3 gap-2">
            {accountTypeOptions(t).map((option) => {
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
            <Label htmlFor="unit">{t("accounts.form.unitLabel")}</Label>
            <Input id="unit" placeholder={t("accounts.form.unitPlaceholder")} {...register("unit")} />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="initial_balance">
            {isInKind ? t("accounts.form.initialQuantityLabel") : t("accounts.form.initialBalanceLabel")}
          </Label>
          <CurrencyInput
            id="initial_balance"
            allowNegative
            suffix={isInKind ? "" : undefined}
            value={initialBalance}
            onValueChange={(next) => setValue("initial_balance", next ?? 0)}
          />
          <p className="text-xs text-muted-foreground">
            {type === "debt"
              ? t("accounts.form.hintDebt")
              : isInKind
                ? t("accounts.form.hintInKind")
                : t("accounts.form.hintDefault")}
          </p>
          {errors.initial_balance && (
            <p className="text-sm text-destructive">{errors.initial_balance.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t("accounts.form.colorLabel")}</Label>
          <ColorPicker value={color} onChange={(next) => setValue("color", next)} />
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t("accounts.form.iconLabel")}</Label>
          <IconPicker
            value={icon}
            color={color}
            options={ACCOUNT_ICON_NAMES}
            onChange={(next) => setValue("icon", next)}
          />
        </div>
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="mt-1 shrink-0">
        {submitting ? t("common.saving") : t("common.save")}
      </Button>
    </form>
  );
}
