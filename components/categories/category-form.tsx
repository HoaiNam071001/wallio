"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/ui/color-picker";
import { IconPicker } from "@/components/ui/icon-picker";
import { EntityIcon } from "@/components/shared/entity-icon";
import { CATEGORY_ICON_NAMES } from "@/lib/theme/icons";
import { DEFAULT_COLOR } from "@/lib/theme/palette";
import { cn } from "@/lib/utils";
import type { Category, CategoryKind } from "@/lib/types/database.types";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Nhập tên danh mục"),
  kind: z.enum(["income", "expense"]),
  icon: z.string().nullable(),
  color: z.string().nullable(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

const KIND_OPTIONS = [
  { value: "expense" as const, label: "Chi tiêu", icon: ArrowUpRight, className: "bg-expense" },
  { value: "income" as const, label: "Thu nhập", icon: ArrowDownLeft, className: "bg-income" },
];

export function CategoryForm({
  defaultValues,
  onSubmit,
  submitting,
}: {
  defaultValues?: Partial<Category>;
  onSubmit: (values: CategoryFormValues) => void;
  submitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      kind: defaultValues?.kind ?? "expense",
      icon: defaultValues?.icon ?? "Utensils",
      color: defaultValues?.color ?? DEFAULT_COLOR,
    },
  });

  const kind = watch("kind");
  const icon = watch("icon");
  const color = watch("color");
  const name = watch("name");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
        <EntityIcon icon={icon} color={color} className="size-12" iconClassName="size-6" />
        <div className="min-w-0">
          <p className="truncate font-bold">{name || "Danh mục mới"}</p>
          <p className="text-xs text-muted-foreground">
            {kind === "income" ? "Danh mục thu nhập" : "Danh mục chi tiêu"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Tên danh mục</Label>
        <Input id="name" placeholder="VD: Ăn uống, Lương, Xăng xe..." {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Loại</Label>
        <div className="grid grid-cols-2 gap-2">
          {KIND_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = kind === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue("kind", option.value as CategoryKind)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-2xl border p-3 text-sm font-semibold transition-all active:scale-95",
                  active
                    ? cn("border-transparent text-white shadow-soft", option.className)
                    : "border-input bg-card/60 text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
                {option.label}
              </button>
            );
          })}
        </div>
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
          options={CATEGORY_ICON_NAMES}
          onChange={(next) => setValue("icon", next)}
        />
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="mt-1">
        {submitting ? "Đang lưu..." : "Lưu"}
      </Button>
    </form>
  );
}
