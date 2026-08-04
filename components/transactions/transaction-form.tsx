"use client";

import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, subDays } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateField } from "@/components/ui/date-field";
import { EntityIcon } from "@/components/shared/entity-icon";
import { AccountSelect } from "@/components/accounts/account-select";
import { useCategories } from "@/lib/hooks/use-categories";
import { useAccountsWithBalance } from "@/lib/hooks/use-accounts";
import { cn, formatAmount } from "@/lib/utils";
import { normalizeColor, withAlpha } from "@/lib/theme/palette";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Dictionary } from "@/lib/i18n/dictionaries/vi";
import type { Transaction, TransactionType } from "@/lib/types/database.types";

/** Zod message chỉ giữ mã lỗi — nội dung hiển thị lấy từ t.transactions.form.validation[code]. */
type ValidationCode = keyof Dictionary["transactions"]["form"]["validation"];

const transactionFormSchema = z
  .object({
    type: z.enum(["income", "expense", "transfer"]),
    amount: z.number().positive("amountPositive" satisfies ValidationCode),
    to_amount: z.number().positive().optional(),
    account_id: z.string().min(1, "chooseAccount" satisfies ValidationCode),
    to_account_id: z.string().optional(),
    category_id: z.string().optional(),
    note: z.string().optional(),
    transaction_date: z.string().min(1, "chooseDate" satisfies ValidationCode),
  })
  .refine((data) => data.type !== "transfer" || !!data.to_account_id, {
    message: "chooseToAccount" satisfies ValidationCode,
    path: ["to_account_id"],
  })
  .refine((data) => data.type !== "transfer" || data.to_account_id !== data.account_id, {
    message: "accountsMustDiffer" satisfies ValidationCode,
    path: ["to_account_id"],
  });

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

function validationMessage(t: Dictionary, code?: string) {
  return code ? t.transactions.form.validation[code as ValidationCode] : undefined;
}

/** Gợi ý nhập nhanh cho mobile. */
const QUICK_AMOUNTS = [10_000, 20_000, 50_000, 100_000, 200_000, 500_000];

export function TransactionForm({
  defaultValues,
  onSubmit,
  submitting,
}: {
  defaultValues?: Partial<Transaction>;
  onSubmit: (values: TransactionFormValues) => void;
  submitting?: boolean;
}) {
  const { t } = useTranslation();
  const { data: categories } = useCategories();
  const { data: accounts } = useAccountsWithBalance();

  const TYPE_OPTIONS = [
    { value: "expense" as const, label: t.transactions.form.typeExpense, icon: ArrowUpRight, color: "var(--expense)" },
    { value: "income" as const, label: t.transactions.form.typeIncome, icon: ArrowDownLeft, color: "var(--income)" },
    {
      value: "transfer" as const,
      label: t.transactions.form.typeTransfer,
      icon: ArrowLeftRight,
      color: "var(--transfer)",
    },
  ];

  const DATE_SHORTCUTS = [
    { label: t.common.today, value: () => format(new Date(), "yyyy-MM-dd") },
    { label: t.common.yesterday, value: () => format(subDays(new Date(), 1), "yyyy-MM-dd") },
  ];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: defaultValues?.type ?? "expense",
      amount: defaultValues?.amount ? Number(defaultValues.amount) : undefined,
      to_amount: defaultValues?.to_amount ? Number(defaultValues.to_amount) : undefined,
      account_id: defaultValues?.account_id ?? "",
      to_account_id: defaultValues?.to_account_id ?? undefined,
      category_id: defaultValues?.category_id ?? undefined,
      note: defaultValues?.note ?? "",
      transaction_date: defaultValues?.transaction_date ?? format(new Date(), "yyyy-MM-dd"),
    },
  });

  const type = watch("type");
  const amount = watch("amount");
  const toAmount = watch("to_amount");
  const accountId = watch("account_id");
  const toAccountId = watch("to_account_id");
  const categoryId = watch("category_id");
  const transactionDate = watch("transaction_date");

  const relevantCategories = useMemo(
    () => categories?.filter((c) => c.kind === type) ?? [],
    [categories, type],
  );

  const fromAccount = accounts?.find((a) => a.id === accountId);
  const toAccount = accounts?.find((a) => a.id === toAccountId);
  // Chuyển đổi hiện vật (vd Momo -> vàng): 2 vế khác đơn vị nên cần 2 ô nhập riêng.
  const isDualAmount =
    type === "transfer" &&
    !!fromAccount &&
    !!toAccount &&
    (fromAccount.type === "in_kind" || toAccount.type === "in_kind");
  const fromUnit = fromAccount?.type === "in_kind" ? (fromAccount.unit?.trim() || "SL") : "đ";
  const toUnit = toAccount?.type === "in_kind" ? (toAccount.unit?.trim() || "SL") : "đ";

  // Chỉ reset khi TYPE thực sự đổi (không phải lần mount đầu) — nếu không, sửa một
  // giao dịch có sẵn sẽ bị xoá mất category_id/to_account_id đang hợp lệ ngay khi mở form.
  const previousType = useRef(type);
  useEffect(() => {
    if (previousType.current === type) return;
    previousType.current = type;

    if (type === "transfer") {
      setValue("category_id", undefined);
    } else {
      setValue("to_account_id", undefined);
      // Đổi qua lại thu <-> chi (hoặc rời khỏi chuyển khoản): danh mục cũ thuộc loại
      // khác không còn hợp lệ, chuyển về danh mục đầu tiên của loại mới.
      const nextCategories = categories?.filter((c) => c.kind === type) ?? [];
      setValue("category_id", nextCategories[0]?.id, { shouldValidate: true });
    }
  }, [type, categories, setValue]);

  // Rời khỏi trường hợp 2 vế khác đơn vị thì bỏ luôn to_amount — coi 2 vế bằng nhau như cũ.
  useEffect(() => {
    if (!isDualAmount) setValue("to_amount", undefined);
  }, [isDualAmount, setValue]);

  const activeType = TYPE_OPTIONS.find((opt) => opt.value === type)!;

  function handleFormSubmit(values: TransactionFormValues) {
    if (isDualAmount && !values.to_amount) {
      setError("to_amount", { message: "enterReceivedAmount" satisfies ValidationCode });
      return;
    }
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
      {/* Chọn loại giao dịch */}
      <div className="flex gap-2">
        {TYPE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = type === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setValue("type", option.value as TransactionType)}
              className={cn(
                "flex min-w-0 flex-1 basis-0 flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-bold transition-all active:scale-95",
                active
                  ? "border-transparent text-white shadow-soft"
                  : "border-input bg-card/60 text-muted-foreground",
              )}
              style={active ? { backgroundColor: option.color } : undefined}
            >
              <Icon className="size-5 shrink-0" />
              <span className="w-full truncate text-center">{option.label}</span>
            </button>
          );
        })}
      </div>

      {/* Số tiền */}
      <div
        className="rounded-3xl p-4"
        style={{ backgroundColor: `color-mix(in oklab, ${activeType.color} 10%, transparent)` }}
      >
        <Label htmlFor="amount" className="text-xs font-bold tracking-wide uppercase opacity-70">
          {isDualAmount
            ? t.transactions.form.amountWithAccount(fromAccount?.name ?? "")
            : t.transactions.form.amountLabel}
        </Label>
        <CurrencyInput
          id="amount"
          autoFocus
          placeholder="0"
          suffix={fromUnit}
          value={amount}
          onValueChange={(next) =>
            setValue("amount", next as number, { shouldValidate: !!errors.amount })
          }
          className="mt-1 h-14 border-0 bg-transparent px-0 text-3xl font-extrabold focus-visible:ring-0 md:text-3xl"
          style={{ color: activeType.color }}
        />
        {/* {fromAccount?.type !== "in_kind" && (
          <div className="hide-scrollbar -mx-1 mt-2 flex gap-2 overflow-x-auto px-1">
            {QUICK_AMOUNTS.map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => setValue("amount", quick, { shouldValidate: true })}
                className="shrink-0 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-foreground/80 transition-transform active:scale-95 dark:bg-white/10"
              >
                {formatAmount(quick)}
              </button>
            ))}
          </div>
        )} */}
        {errors.amount && (
          <p className="mt-1 text-sm text-destructive">
            {validationMessage(t, errors.amount.message)}
          </p>
        )}

        {isDualAmount && (
          <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/10">
            <Label
              htmlFor="to_amount"
              className="text-xs font-bold tracking-wide uppercase opacity-70"
            >
              {t.transactions.form.receivedWithAccount(toAccount?.name ?? "")}
            </Label>
            <CurrencyInput
              id="to_amount"
              placeholder="0"
              suffix={toUnit}
              value={toAmount}
              onValueChange={(next) =>
                setValue("to_amount", next as number, { shouldValidate: !!errors.to_amount })
              }
              className="mt-1 h-12 border-0 bg-transparent px-0 text-2xl font-extrabold focus-visible:ring-0"
              style={{ color: activeType.color }}
            />
            {errors.to_amount && (
              <p className="mt-1 text-sm text-destructive">
                {validationMessage(t, errors.to_amount.message)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Danh mục dạng chip */}
      {type !== "transfer" && (
        <div className="flex flex-col gap-2">
          <Label>{t.transactions.form.category}</Label>
          {relevantCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.transactions.form.noCategoryOf(
                type === "income"
                  ? t.transactions.form.kindIncomeLower
                  : t.transactions.form.kindExpenseLower,
              )}
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {relevantCategories.map((category) => {
                const active = categoryId === category.id;
                const color = normalizeColor(category.color);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setValue("category_id", active ? undefined : category.id)}
                    className={cn(
                      "flex min-w-0 flex-col items-center gap-1 rounded-2xl border p-2 transition-all active:scale-95",
                      active ? "border-transparent" : "border-transparent",
                    )}
                    style={active ? { backgroundColor: withAlpha(color, 0.14) } : undefined}
                  >
                    <EntityIcon
                      icon={category.icon}
                      color={category.color}
                      className={cn("size-10", active && "ring-2")}
                    />
                    <span
                      className={cn(
                        "line-clamp-1 text-[11px] font-semibold",
                        active ? "" : "text-muted-foreground",
                      )}
                      style={active ? { color } : undefined}
                    >
                      {category.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Nguồn tiền */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2">
          <Label>{type === "transfer" ? t.transactions.form.fromAccount : t.transactions.form.account}</Label>
          <AccountSelect
            value={accountId}
            onChange={(v) => setValue("account_id", v)}
            excludeTypes={type !== "transfer" ? ["in_kind"] : undefined}
          />
          {errors.account_id && (
            <p className="text-sm text-destructive">{validationMessage(t, errors.account_id.message)}</p>
          )}
        </div>

        {type === "transfer" && (
          <div className="flex min-w-0 flex-col gap-2">
            <Label>{t.transactions.form.toAccount}</Label>
            <AccountSelect
              value={toAccountId}
              onChange={(v) => setValue("to_account_id", v)}
              placeholder={t.transactions.form.toAccountPlaceholder}
              excludeId={accountId}
            />
            {errors.to_account_id && (
              <p className="text-sm text-destructive">
                {validationMessage(t, errors.to_account_id.message)}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="transaction_date">{t.transactions.form.date}</Label>
          <div className="flex flex-wrap items-center gap-2">
            <DateField
              id="transaction_date"
              value={transactionDate}
              onChange={(next) => setValue("transaction_date", next, { shouldValidate: true })}
              className="w-40"
            />
            {DATE_SHORTCUTS.map((shortcut) => {
              const target = shortcut.value();
              return (
                <button
                  key={shortcut.label}
                  type="button"
                  onClick={() => setValue("transaction_date", target, { shouldValidate: true })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-bold transition-all active:scale-95",
                    transactionDate === target
                      ? "border-transparent bg-brand-500/15 text-brand-700"
                      : "border-border bg-card/70 text-muted-foreground",
                  )}
                >
                  {shortcut.label}
                </button>
              );
            })}
          </div>
          {errors.transaction_date && (
            <p className="text-sm text-destructive">
              {validationMessage(t, errors.transaction_date.message)}
            </p>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="note">{t.transactions.form.note}</Label>
          <Textarea id="note" placeholder={t.transactions.form.notePlaceholder} {...register("note")} />
        </div>
      </div>

      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? t.common.saving : t.transactions.form.submit}
      </Button>
    </form>
  );
}
