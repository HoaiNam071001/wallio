"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityIcon } from "@/components/shared/entity-icon";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/lib/hooks/use-categories";
import { normalizeColor, withAlpha } from "@/lib/theme/palette";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Category, CategoryKind } from "@/lib/types/database.types";

export default function CategoriesPage() {
  const { t } = useTranslation();
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
            toast.success(t.categories.page.toastUpdated);
            setFormOpen(false);
          },
          onError: () => toast.error(t.common.genericError),
        },
      );
      return;
    }

    if (!user) return;
    createCategory.mutate(
      { ...values, user_id: user.id },
      {
        onSuccess: () => {
          toast.success(t.categories.page.toastAdded);
          setFormOpen(false);
        },
        onError: () => toast.error(t.common.genericError),
      },
    );
  }

  function handleDelete() {
    if (!deleting) return;
    deleteCategory.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(t.categories.page.toastDeleted);
        setDeleting(null);
      },
      onError: () => {
        toast.error(t.categories.page.toastDeleteError);
        setDeleting(null);
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t.categories.page.title}
        subtitle={t.categories.page.subtitle}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            {t.common.add}
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as CategoryKind)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expense">{t.categories.page.tabExpense}</TabsTrigger>
          <TabsTrigger value="income">{t.categories.page.tabIncome}</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && <p className="text-muted-foreground">{t.common.loading}</p>}

      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={Tags}
          title={t.categories.page.emptyTitle(
            tab === "income" ? t.transactions.form.kindIncomeLower : t.transactions.form.kindExpenseLower,
          )}
          description={t.categories.page.emptyDescription}
          action={
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              {t.categories.page.addCategory}
            </Button>
          }
        />
      )}

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((category) => {
          const color = normalizeColor(category.color);
          return (
            <div
              key={category.id}
              className="glass flex items-center gap-3 rounded-3xl p-3"
              style={{
                backgroundImage: `linear-gradient(135deg, ${withAlpha(color, 0.14)}, transparent 70%)`,
              }}
            >
              <EntityIcon icon={category.icon} color={color} />
              <span className="min-w-0 flex-1 truncate font-bold">{category.name}</span>
              <div className="flex shrink-0 gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={t.common.edit}
                  onClick={() => openEdit(category)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive"
                  aria-label={t.common.delete}
                  onClick={() => setDeleting(category)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t.categories.page.editTitle : t.categories.page.addTitle}</DialogTitle>
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
            <AlertDialogTitle>{t.categories.page.deleteTitle(deleting?.name ?? "")}</AlertDialogTitle>
            <AlertDialogDescription>{t.categories.page.deleteDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t.common.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
