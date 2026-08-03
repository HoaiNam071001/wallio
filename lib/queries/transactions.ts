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
}

export type TransactionWithRelations = Transaction & {
  account: { id: string; name: string; type: string } | null;
  to_account: { id: string; name: string; type: string } | null;
  category: { id: string; name: string; kind: string } | null;
};

export async function listTransactions(
  supabase: Client,
  filters: TransactionFilters = {},
): Promise<TransactionWithRelations[]> {
  let query = supabase
    .from("transactions")
    .select(
      `*,
      account:accounts!transactions_account_id_fkey(id,name,type),
      to_account:accounts!transactions_to_account_id_fkey(id,name,type),
      category:categories(id,name,kind)`,
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
  if (filters.limit) query = query.limit(filters.limit);

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
