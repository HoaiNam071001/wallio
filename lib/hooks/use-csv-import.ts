"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/hooks/use-supabase";
import { useAuth } from "@/lib/hooks/use-auth";
import { bulkCreateAccounts, bulkDeleteAccounts } from "@/lib/queries/accounts";
import { bulkCreateCategories } from "@/lib/queries/categories";
import { bulkCreateTransactions } from "@/lib/queries/transactions";
import type { ParsedCategory } from "@/lib/utils/csv-import";
import type {
  AccountType,
  Category,
  TransactionInsert,
  TransactionType,
} from "@/lib/types/database.types";

export interface ImportAccountInput {
  sourceId: string;
  name: string;
  type: AccountType;
  unit: string | null;
  initialBalance: number;
  mapping: "new" | { existingAccountId: string };
}

export interface ImportTransactionInput {
  sourceId: string;
  date: string;
  type: TransactionType;
  amount: number;
  toAmount: number | null;
  accountSourceId: string;
  toAccountSourceId: string | null;
  categorySourceId: string | null;
  note: string | null;
}

/**
 * Nhập dữ liệu đã parse từ CSV export của Wallio: tạo account mới (nếu chọn "Tạo mới"), khớp/
 * tạo category theo tên+loại, rồi tạo transaction — chỉ những account/transaction người dùng đã
 * chọn mới được truyền vào đây (lọc effectiveSelected đã làm ở UI). Nếu bước tạo transaction thất
 * bại, best-effort xoá lại các account vừa tạo trong lần import này (không có transaction đa bảng
 * ở phía client với supabase-js).
 */
export function useImportWallioCsv() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      accounts,
      categories,
      transactions,
      existingCategories,
    }: {
      accounts: ImportAccountInput[];
      categories: ParsedCategory[];
      transactions: ImportTransactionInput[];
      existingCategories: Category[];
    }) => {
      if (!user) throw new Error("not-authenticated");

      const newAccounts = accounts.filter(
        (a): a is ImportAccountInput & { mapping: "new" } => a.mapping === "new",
      );
      const created = await bulkCreateAccounts(
        supabase,
        newAccounts.map((a) => ({
          user_id: user.id,
          name: a.name,
          type: a.type,
          unit: a.unit,
          initial_balance: a.initialBalance,
        })),
      );

      const accountIdMap = new Map<string, string>();
      let createdIndex = 0;
      for (const a of accounts) {
        if (a.mapping === "new") {
          accountIdMap.set(a.sourceId, created[createdIndex].id);
          createdIndex += 1;
        } else {
          accountIdMap.set(a.sourceId, a.mapping.existingAccountId);
        }
      }

      const categoryIdMap = new Map<string, string>();
      const toCreateCategories: ParsedCategory[] = [];
      for (const c of categories) {
        const match = existingCategories.find(
          (ec) => ec.kind === c.kind && ec.name.trim().toLowerCase() === c.name.trim().toLowerCase(),
        );
        if (match) categoryIdMap.set(c.sourceId, match.id);
        else toCreateCategories.push(c);
      }
      if (toCreateCategories.length > 0) {
        const createdCategories = await bulkCreateCategories(
          supabase,
          toCreateCategories.map((c) => ({ user_id: user.id, name: c.name, kind: c.kind })),
        );
        toCreateCategories.forEach((c, i) => categoryIdMap.set(c.sourceId, createdCategories[i].id));
      }

      const txInputs: TransactionInsert[] = transactions.map((t) => ({
        user_id: user.id,
        type: t.type,
        amount: t.amount,
        to_amount: t.toAmount,
        account_id: accountIdMap.get(t.accountSourceId)!,
        to_account_id: t.toAccountSourceId ? (accountIdMap.get(t.toAccountSourceId) ?? null) : null,
        category_id: t.categorySourceId ? (categoryIdMap.get(t.categorySourceId) ?? null) : null,
        note: t.note,
        transaction_date: t.date,
      }));

      try {
        const insertedTransactions = await bulkCreateTransactions(supabase, txInputs);
        return { accountsCreated: created.length, transactionsCreated: insertedTransactions.length };
      } catch (err) {
        if (created.length > 0) {
          await bulkDeleteAccounts(
            supabase,
            created.map((a) => a.id),
          ).catch(() => {});
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account-balances"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}
