"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/hooks/use-supabase";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  createCategory,
  deleteCategory,
  listCategories,
  setDefaultCategory,
  updateCategory,
} from "@/lib/queries/categories";
import { categoriesCacheKey, withOfflineCache } from "@/lib/offline/cache";
import type { CategoryInsert, CategoryKind, CategoryUpdate } from "@/lib/types/database.types";

/** Cache lại danh mục để xem offline (dùng cho trang Categories và form ghi giao dịch). */
export function useCategories() {
  const supabase = useSupabase();
  const { user } = useAuth();
  return useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      withOfflineCache(categoriesCacheKey(user!.id), () => listCategories(supabase)),
    enabled: !!user,
    retry: false,
  });
}

export function useCreateCategory() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInsert) => createCategory(supabase, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryUpdate }) =>
      updateCategory(supabase, id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

/** Chọn/bỏ danh mục mặc định của một loại (tối đa 1 mỗi loại, mỗi user). */
export function useSetDefaultCategory() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ kind, id }: { kind: CategoryKind; id: string | null }) =>
      setDefaultCategory(supabase, user!.id, kind, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(supabase, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}
