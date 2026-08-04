import type { Account, Category } from "@/lib/types/database.types";
import type { TransactionWithRelations } from "@/lib/queries/transactions";

export const WALLIO_EXPORT_MARKER = "#WALLIO_EXPORT v1";

function csvField(value: string | number | null | undefined): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function csvLine(values: (string | number | null | undefined)[]): string {
  return values.map(csvField).join(",");
}

/**
 * Xuất một file CSV nhiều phần (accounts + categories + transactions) tự mô tả, để có thể
 * nhập lại đầy đủ cả nguồn tiền lẫn giao dịch cho một tài khoản khác — không chỉ riêng
 * transaction rows như bản cũ. Tham chiếu account/category trong #TRANSACTIONS dùng `id` của
 * chính file này (ổn định trong phạm vi 1 lần export), không dùng tên hiển thị vì 2 nguồn tiền
 * có thể trùng tên.
 */
export function buildWallioExportCsv({
  accounts,
  categories,
  transactions,
  startDate,
  endDate,
}: {
  accounts: (Account & { current_balance?: number })[];
  categories: Category[];
  transactions: TransactionWithRelations[];
  startDate: string;
  endDate: string;
}): string {
  const accountIndex = new Map(accounts.map((a, i) => [a.id, `acc_${i + 1}`]));
  const categoryIndex = new Map(categories.map((c, i) => [c.id, `cat_${i + 1}`]));

  const lines: string[] = [];
  lines.push(WALLIO_EXPORT_MARKER);
  lines.push(csvLine(["#RANGE", startDate, endDate]));

  lines.push("#ACCOUNTS");
  lines.push(csvLine(["id", "name", "type", "unit", "initial_balance", "current_balance"]));
  for (const a of accounts) {
    lines.push(
      csvLine([
        accountIndex.get(a.id),
        a.name,
        a.type,
        a.unit ?? "",
        a.initial_balance,
        a.current_balance ?? "",
      ]),
    );
  }

  lines.push("#CATEGORIES");
  lines.push(csvLine(["id", "name", "kind"]));
  for (const c of categories) {
    lines.push(csvLine([categoryIndex.get(c.id), c.name, c.kind]));
  }

  lines.push("#TRANSACTIONS");
  lines.push(csvLine(["id", "date", "type", "amount", "to_amount", "account", "to_account", "category", "note"]));
  transactions.forEach((tx, i) => {
    lines.push(
      csvLine([
        `tx_${i + 1}`,
        tx.transaction_date,
        tx.type,
        tx.amount,
        tx.to_amount ?? "",
        tx.account_id ? (accountIndex.get(tx.account_id) ?? "") : "",
        tx.to_account_id ? (accountIndex.get(tx.to_account_id) ?? "") : "",
        tx.category_id ? (categoryIndex.get(tx.category_id) ?? "") : "",
        tx.note ?? "",
      ]),
    );
  });

  const csv = lines.join("\n");
  return "﻿" + csv;
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
