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
import type { Category } from "@/lib/types/database.types";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Nhập tên danh mục"),
  kind: z.enum(["income", "expense"]),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

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
    },
  });

  const kind = watch("kind");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Tên danh mục</Label>
        <Input id="name" placeholder="VD: Ăn uống, Lương, Xăng xe..." {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Loại</Label>
        <Select value={kind} onValueChange={(v) => setValue("kind", v as CategoryFormValues["kind"])}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Chi tiêu</SelectItem>
            <SelectItem value="income">Thu nhập</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={submitting} className="mt-2">
        {submitting ? "Đang lưu..." : "Lưu"}
      </Button>
    </form>
  );
}
