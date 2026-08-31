import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Category,
  CategoryInsert,
  CategoryKind,
  CategoryUpdate,
  Database,
} from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export async function listCategories(supabase: Client): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createCategory(supabase: Client, input: CategoryInsert): Promise<Category> {
  const { data, error } = await supabase.from("categories").insert(input).select().single();

  if (error) throw error;
  return data;
}

/** Tạo nhiều category cùng lúc — dùng khi nhập CSV cho các category chưa khớp category có sẵn. */
export async function bulkCreateCategories(
  supabase: Client,
  inputs: CategoryInsert[],
): Promise<Category[]> {
  if (inputs.length === 0) return [];
  const { data, error } = await supabase.from("categories").insert(inputs).select();

  if (error) throw error;
  return data;
}

export async function updateCategory(
  supabase: Client,
  id: string,
  input: CategoryUpdate,
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(supabase: Client, id: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Đánh dấu danh mục mặc định cho một loại (chi tiêu / thu nhập). Mỗi user tối đa 1 danh mục
 * mỗi loại — gỡ cờ cũ trước rồi mới gắn cờ mới, xem `setDefaultAccount`. `id = null` để bỏ.
 */
export async function setDefaultCategory(
  supabase: Client,
  userId: string,
  kind: CategoryKind,
  id: string | null,
): Promise<void> {
  const { error: clearError } = await supabase
    .from("categories")
    .update({ is_default: false })
    .eq("user_id", userId)
    .eq("kind", kind)
    .eq("is_default", true);
  if (clearError) throw clearError;

  if (!id) return;

  const { error } = await supabase.from("categories").update({ is_default: true }).eq("id", id);
  if (error) throw error;
}
