"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/hooks/use-supabase";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/lib/queries/categories";
import { categoriesCacheKey, withOfflineCache } from "@/lib/offline/cache";
import type { CategoryInsert, CategoryUpdate } from "@/lib/types/database.types";

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

export function useDeleteCategory() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(supabase, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}
