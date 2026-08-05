import { kvGet, kvSet } from "@/lib/offline/db";
import type { AccountWithBalance, Category, Profile } from "@/lib/types/database.types";

/**
 * Thử gọi mạng trước; thành công thì ghi cache rồi trả về. Thất bại (mất mạng, lỗi request) thì
 * đọc cache — có thì trả tạm dữ liệu cũ, không có thì ném lại lỗi gốc cho React Query xử lý.
 */
export async function withOfflineCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  try {
    const data = await fetcher();
    void kvSet(cacheKey, data);
    return data;
  } catch (error) {
    const cached = await kvGet<T>(cacheKey);
    if (cached !== undefined) return cached;
    throw error;
  }
}

export const accountsWithBalanceCacheKey = (userId: string) => `accounts-with-balance:${userId}`;
export const categoriesCacheKey = (userId: string) => `categories:${userId}`;
export const profileCacheKey = (userId: string) => `profile:${userId}`;

export const getCachedAccountsWithBalance = (userId: string) =>
  kvGet<AccountWithBalance[]>(accountsWithBalanceCacheKey(userId));

export const getCachedCategories = (userId: string) =>
  kvGet<Category[]>(categoriesCacheKey(userId));

export const getCachedProfile = (userId: string) => kvGet<Profile>(profileCacheKey(userId));
