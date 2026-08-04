import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Profile, ProfileUpdate } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

/** Chưa từng lưu hồ sơ (chưa vào trang Profile lần nào) -> coi như hồ sơ rỗng, chưa đặt PIN. */
export async function getProfile(supabase: Client, userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  return {
    id: userId,
    display_name: null,
    birth_year: null,
    pin_hash: null,
    pin_set_at: null,
    updated_at: new Date().toISOString(),
  };
}

export async function upsertProfile(
  supabase: Client,
  userId: string,
  input: Omit<ProfileUpdate, "id">,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...input, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw error;
  return data;
}
