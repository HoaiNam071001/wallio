"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CategoryForm, type CategoryFormValues } from "@/components/categories/category-form";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/lib/hooks/use-categories";
import type { Category, CategoryKind } from "@/lib/types/database.types";

export default function CategoriesPage() {
  const { user } = useAuth();
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [tab, setTab] = useState<CategoryKind>("expense");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const filtered = useMemo(
    () => categories?.filter((c) => c.kind === tab) ?? [],
    [categories, tab],
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setFormOpen(true);
  }

  function handleSubmit(values: CategoryFormValues) {
    if (editing) {
      updateCategory.mutate(
        { id: editing.id, input: values },
        {
          onSuccess: () => {
            toast.success("Đã cập nhật danh mục");
            setFormOpen(false);
          },
          onError: () => toast.error("Có lỗi xảy ra, thử lại sau"),
        },
      );
      return;
    }

    if (!user) return;
    createCategory.mutate(
      { ...values, user_id: user.id },
      {
        onSuccess: () => {
          toast.success("Đã thêm danh mục");
          setFormOpen(false);
        },
        onError: () => toast.error("Có lỗi xảy ra, thử lại sau"),
      },
    );
  }

  function handleDelete() {
    if (!deleting) return;
    deleteCategory.mutate(deleting.id, {
      onSuccess: () => {
        toast.success("Đã xoá danh mục");
        setDeleting(null);
      },
      onError: () => {
        toast.error("Không thể xoá danh mục");
        setDeleting(null);
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Danh mục</h1>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Thêm danh mục
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as CategoryKind)}>
        <TabsList>
          <TabsTrigger value="expense">Chi tiêu</TabsTrigger>
          <TabsTrigger value="income">Thu nhập</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && <p className="text-muted-foreground">Đang tải...</p>}

      {!isLoading && filtered.length === 0 && (
        <p className="text-muted-foreground">Chưa có danh mục nào.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((category) => (
          <Card key={category.id}>
            <CardContent className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">{category.name}</span>
                <Badge variant={category.kind === "income" ? "income" : "expense"}>
                  {category.kind === "income" ? "Thu" : "Chi"}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleting(category)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa danh mục" : "Thêm danh mục"}</DialogTitle>
          </DialogHeader>
          <CategoryForm
            defaultValues={editing ?? { kind: tab }}
            onSubmit={handleSubmit}
            submitting={createCategory.isPending || updateCategory.isPending}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá danh mục &quot;{deleting?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Các giao dịch đang dùng danh mục này sẽ chuyển về &quot;Không phân loại&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Xoá</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
