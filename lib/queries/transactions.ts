import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Transaction,
  TransactionInsert,
  TransactionUpdate,
  TransactionType,
} from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  search?: string;
  limit?: number;
  offset?: number;
}

interface RelatedAccount {
  id: string;
  name: string;
  type: string;
  color: string | null;
  icon: string | null;
  unit: string | null;
}

interface RelatedCategory {
  id: string;
  name: string;
  kind: string;
  color: string | null;
  icon: string | null;
}

export type TransactionWithRelations = Transaction & {
  account: RelatedAccount | null;
  to_account: RelatedAccount | null;
  category: RelatedCategory | null;
};

export async function listTransactions(
  supabase: Client,
  filters: TransactionFilters = {},
): Promise<TransactionWithRelations[]> {
  let query = supabase
    .from("transactions")
    .select(
      `*,
      account:accounts!transactions_account_id_fkey(id,name,type,color,icon,unit),
      to_account:accounts!transactions_to_account_id_fkey(id,name,type,color,icon,unit),
      category:categories(id,name,kind,color,icon)`,
    )
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.startDate) query = query.gte("transaction_date", filters.startDate);
  if (filters.endDate) query = query.lte("transaction_date", filters.endDate);
  if (filters.accountId)
    query = query.or(`account_id.eq.${filters.accountId},to_account_id.eq.${filters.accountId}`);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.search) query = query.ilike("note", `%${filters.search}%`);
  if (filters.limit && filters.offset !== undefined) {
    query = query.range(filters.offset, filters.offset + filters.limit - 1);
  } else if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as TransactionWithRelations[];
}

export async function createTransaction(
  supabase: Client,
  input: TransactionInsert,
): Promise<Transaction> {
  const { data, error } = await supabase.from("transactions").insert(input).select().single();

  if (error) throw error;
  return data;
}

/** Tạo nhiều giao dịch cùng lúc — dùng khi nhập CSV, một round-trip thay vì N lần insert đơn. */
export async function bulkCreateTransactions(
  supabase: Client,
  inputs: TransactionInsert[],
): Promise<Transaction[]> {
  if (inputs.length === 0) return [];
  const { data, error } = await supabase.from("transactions").insert(inputs).select();

  if (error) throw error;
  return data;
}

export async function updateTransaction(
  supabase: Client,
  id: string,
  input: TransactionUpdate,
): Promise<Transaction> {
  const { data, error } = await supabase
    .from("transactions")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTransaction(supabase: Client, id: string): Promise<void> {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}
