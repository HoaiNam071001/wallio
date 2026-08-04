import Papa from "papaparse";
import { WALLIO_EXPORT_MARKER } from "@/lib/utils/csv-export";
import type { AccountType, CategoryKind, TransactionType } from "@/lib/types/database.types";

const ACCOUNT_TYPES: AccountType[] = ["cash", "ewallet", "bank", "lending", "debt", "in_kind", "other"];
const CATEGORY_KINDS: CategoryKind[] = ["income", "expense"];
const TRANSACTION_TYPES: TransactionType[] = ["income", "expense", "transfer"];

export interface ParsedAccount {
  sourceId: string;
  name: string;
  type: AccountType;
  unit: string | null;
  initialBalance: number;
  currentBalance: number | null;
}

export interface ParsedCategory {
  sourceId: string;
  name: string;
  kind: CategoryKind;
}

export interface ParsedTransaction {
  sourceId: string;
  date: string;
  type: TransactionType;
  amount: number;
  toAmount: number | null;
  accountSourceId: string;
  toAccountSourceId: string | null;
  categorySourceId: string | null;
  note: string | null;
  /** false nếu account/category tham chiếu không tồn tại trong file — hàng này nên bị bỏ qua. */
  resolvable: boolean;
}

export interface ParsedWallioExport {
  accounts: ParsedAccount[];
  categories: ParsedCategory[];
  transactions: ParsedTransaction[];
  /** Số hàng transaction bị bỏ qua vì không xác định được account/category. */
  unresolvedCount: number;
}

function splitSections(text: string): { accounts: string; categories: string; transactions: string } {
  const accountsStart = text.indexOf("#ACCOUNTS");
  const categoriesStart = text.indexOf("#CATEGORIES");
  const transactionsStart = text.indexOf("#TRANSACTIONS");

  if (accountsStart === -1 || categoriesStart === -1 || transactionsStart === -1) {
    throw new Error("missing-sections");
  }

  return {
    accounts: text.slice(accountsStart + "#ACCOUNTS".length, categoriesStart),
    categories: text.slice(categoriesStart + "#CATEGORIES".length, transactionsStart),
    transactions: text.slice(transactionsStart + "#TRANSACTIONS".length),
  };
}

function parseSection<T extends object>(section: string): T[] {
  const result = Papa.parse<T>(section.trim(), { header: true, skipEmptyLines: true });
  return result.data;
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toNullableNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Parse file CSV xuất từ Wallio (`buildWallioExportCsv`). Ném lỗi nếu cấu trúc marker sai/hỏng. */
export function parseWallioExportCsv(rawText: string): ParsedWallioExport {
  // Bỏ BOM nếu có, để so khớp marker chính xác.
  const text = rawText.replace(/^﻿/, "");
  if (!text.startsWith(WALLIO_EXPORT_MARKER)) {
    throw new Error("invalid-marker");
  }

  const sections = splitSections(text);

  const rawAccounts = parseSection<Record<string, string>>(sections.accounts);
  const accounts: ParsedAccount[] = rawAccounts
    .filter((row) => row.id)
    .map((row) => ({
      sourceId: row.id,
      name: row.name ?? "",
      type: ACCOUNT_TYPES.includes(row.type as AccountType) ? (row.type as AccountType) : "other",
      unit: row.unit || null,
      initialBalance: toNumber(row.initial_balance),
      currentBalance: toNullableNumber(row.current_balance),
    }));

  const rawCategories = parseSection<Record<string, string>>(sections.categories);
  const categories: ParsedCategory[] = rawCategories
    .filter((row) => row.id)
    .map((row) => ({
      sourceId: row.id,
      name: row.name ?? "",
      kind: CATEGORY_KINDS.includes(row.kind as CategoryKind) ? (row.kind as CategoryKind) : "expense",
    }));

  const accountIds = new Set(accounts.map((a) => a.sourceId));
  const categoryIds = new Set(categories.map((c) => c.sourceId));

  const rawTransactions = parseSection<Record<string, string>>(sections.transactions);
  let unresolvedCount = 0;
  const transactions: ParsedTransaction[] = rawTransactions
    .filter((row) => row.id)
    .map((row) => {
      const type = TRANSACTION_TYPES.includes(row.type as TransactionType)
        ? (row.type as TransactionType)
        : "expense";
      const accountSourceId = row.account ?? "";
      const toAccountSourceId = row.to_account || null;
      const categorySourceId = row.category || null;

      const accountOk = accountIds.has(accountSourceId);
      const toAccountOk = !toAccountSourceId || accountIds.has(toAccountSourceId);
      const categoryOk = !categorySourceId || categoryIds.has(categorySourceId);
      const resolvable = accountOk && toAccountOk && categoryOk;
      if (!resolvable) unresolvedCount += 1;

      return {
        sourceId: row.id,
        date: row.date ?? "",
        type,
        amount: toNumber(row.amount),
        toAmount: toNullableNumber(row.to_amount),
        accountSourceId,
        toAccountSourceId,
        categorySourceId,
        note: row.note || null,
        resolvable,
      };
    });

  return { accounts, categories, transactions, unresolvedCount };
}
