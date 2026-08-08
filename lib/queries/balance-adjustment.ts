import type { SupabaseClient } from "@supabase/supabase-js";
import type { CategoryKind, Database } from "@/lib/types/database.types";
import { getAccountBalanceAsOf } from "@/lib/queries/accounts";

type Client = SupabaseClient<Database>;

/** Tên danh mục tự sinh cho các bút toán cân đối, để chúng hiện rõ trong báo cáo. */
export const ADJUSTMENT_CATEGORY_NAME = "Điều chỉnh số dư";

export interface AdjustBalanceInput {
  userId: string;
  accountId: string;
  /** Số tiền THỰC TẾ đang có tại ngày `date`. */
  actualBalance: number;
  date: string;
  note?: string;
}

export interface AdjustBalanceResult {
  /** Số dư app đang tính tại ngày đó, trước khi cân đối. */
  expected: number;
  /** actual - expected. Bằng 0 nghĩa là không cần tạo bút toán nào. */
  difference: number;
}

/**
 * Chốt lại số dư thực tế của một nguồn tiền tại một ngày.
 *
 * Thay vì sửa `initial_balance` (làm sai lệch toàn bộ lịch sử), hàm này ghi thêm
 * MỘT giao dịch thu/chi đúng bằng phần chênh lệch vào đúng ngày cân đối. Nhờ vậy:
 * - số dư từ ngày đó trở đi khớp thực tế,
 * - các giao dịch đã ghi trước đó vẫn giữ nguyên,
 * - giao dịch ghi sau ngày cân đối vẫn cộng/trừ bình thường.
 */
export async function adjustAccountBalance(
  supabase: Client,
  input: AdjustBalanceInput,
): Promise<AdjustBalanceResult> {
  const expected = await getAccountBalanceAsOf(supabase, input.accountId, input.date);
  const difference = Math.round(input.actualBalance - expected);

  if (difference === 0) return { expected, difference };

  const kind: CategoryKind = difference > 0 ? "income" : "expense";
  const categoryId = await findOrCreateAdjustmentCategory(supabase, input.userId, kind);

  const { error } = await supabase.from("transactions").insert({
    user_id: input.userId,
    type: kind,
    amount: Math.abs(difference),
    account_id: input.accountId,
    category_id: categoryId,
    transaction_date: input.date,
    note: input.note?.trim() || "Cân đối số dư thực tế",
  });

  if (error) throw error;
  return { expected, difference };
}

async function findOrCreateAdjustmentCategory(
  supabase: Client,
  userId: string,
  kind: CategoryKind,
): Promise<string> {
  // Nhận diện qua cờ `is_system`, không qua `name` — nhờ vậy user đổi tên danh
  // mục này (VD: "Cân đối số dư") vẫn không khiến hệ thống tạo thêm bản mới.
  const { data: existing, error: findError } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("kind", kind)
    .eq("is_system", true)
    .limit(1)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing.id;

  const { data: created, error: createError } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: ADJUSTMENT_CATEGORY_NAME,
      kind,
      icon: "Scale",
      color: "#64748b",
      is_system: true,
    })
    .select("id")
    .single();

  if (createError) throw createError;
  return created.id;
}
