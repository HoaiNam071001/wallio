import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, CategoryInsert, CategoryUpdate, Database } from "@/lib/types/database.types";

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
