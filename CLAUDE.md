# Personal Finance Tracker — Project Spec

> File này dùng làm bối cảnh (context) cho Claude Code khi scaffold dự án.
> Đưa file này vào project, sau đó có thể yêu cầu Claude Code: "Đọc PROJECT_SPEC.md và scaffold toàn bộ project theo đúng spec này."

## 1. Mục tiêu

Web app quản lý thu chi cá nhân, responsive (mobile + desktop), có:
- Ghi nhận thu/chi với danh mục (category) tự tạo (dynamic)
- Quản lý nhiều **nguồn tiền** (account): tiền mặt, ví điện tử (Momo, ShopeePay...), ngân hàng, khoản cho mượn, khoản nợ
- Giao dịch **chuyển khoản giữa các nguồn tiền** (VD: rút Momo → tiền mặt, cho mượn, trả nợ)
- Filter theo ngày / tuần / tháng / năm / khoảng ngày tuỳ chọn
- Summary: tổng tài sản, tiền khả dụng thực tế, thu/chi theo kỳ, breakdown theo category/account
- Đăng nhập bằng Google (qua Supabase Auth)

## 2. Tech stack

| Layer | Công nghệ |
|---|---|
| Framework | Next.js (App Router, latest version) + TypeScript |
| UI | TailwindCSS + shadcn/ui |
| Charts | Recharts |
| Backend/DB | Supabase (Postgres + Auth + RLS) |
| State/data fetching | @supabase/supabase-js + React Query (TanStack Query) |
| Date handling | date-fns |
| Form | react-hook-form + zod |
| Deploy | Vercel |

## 3. Cấu trúc thư mục đề xuất

```
/app
  /(auth)
    /login/page.tsx
  /(dashboard)
    /dashboard/page.tsx          -- summary tổng quan
    /transactions/page.tsx       -- danh sách giao dịch + filter
    /transactions/new/page.tsx   -- thêm giao dịch
    /accounts/page.tsx           -- quản lý nguồn tiền
    /categories/page.tsx         -- quản lý danh mục
    /reports/page.tsx            -- báo cáo chi tiết theo filter
  /api (nếu cần route handler)
  layout.tsx
/components
  /ui (shadcn components)
  /transactions (TransactionForm, TransactionList, TransactionFilter)
  /accounts (AccountCard, AccountForm)
  /charts (SummaryChart, CategoryBreakdownChart)
/lib
  /supabase (client.ts, server.ts, middleware.ts)
  /queries (accounts.ts, transactions.ts, categories.ts, summary.ts)
  /types (database.types.ts -- generate từ supabase)
  /utils (date-range.ts, currency.ts)
/supabase
  /migrations (schema SQL)
```

## 4. Database schema (Supabase / Postgres)

```sql
-- ================= ACCOUNTS =================
create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,                    -- "Momo", "Tiền mặt", "Vietcombank", "Cho A mượn", "Nợ ShopeePay"
  type text not null check (type in ('cash','ewallet','bank','lending','debt','other')),
  initial_balance numeric not null default 0,
  is_active boolean not null default true,
  icon text,
  color text,
  created_at timestamptz not null default now()
);

-- ================= CATEGORIES =================
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,                    -- "Ăn uống", "Lương", "Xăng xe"...
  kind text not null check (kind in ('income','expense')),
  icon text,
  color text,
  created_at timestamptz not null default now()
);

-- ================= TRANSACTIONS =================
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense','transfer')),
  amount numeric not null check (amount > 0),
  account_id uuid not null references accounts(id) on delete restrict,
  to_account_id uuid references accounts(id) on delete restrict, -- chỉ dùng khi type = transfer
  category_id uuid references categories(id) on delete set null, -- null nếu transfer
  note text,
  transaction_date date not null default current_date,
  created_at timestamptz not null default now(),
  constraint transfer_needs_to_account check (
    (type = 'transfer' and to_account_id is not null) or
    (type != 'transfer')
  )
);

create index idx_transactions_user_date on transactions(user_id, transaction_date);
create index idx_transactions_account on transactions(account_id);

-- ================= VIEW: account balance hiện tại =================
create or replace view account_balances as
select
  a.id as account_id,
  a.user_id,
  a.name,
  a.type,
  a.initial_balance
    + coalesce(sum(case when t.type='income' and t.account_id=a.id then t.amount else 0 end),0)
    - coalesce(sum(case when t.type='expense' and t.account_id=a.id then t.amount else 0 end),0)
    - coalesce(sum(case when t.type='transfer' and t.account_id=a.id then t.amount else 0 end),0)
    + coalesce(sum(case when t.type='transfer' and t.to_account_id=a.id then t.amount else 0 end),0)
    as current_balance
from accounts a
left join transactions t
  on t.account_id = a.id or t.to_account_id = a.id
group by a.id;

-- ================= RLS =================
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;

create policy "user manages own accounts" on accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user manages own categories" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user manages own transactions" on transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

> Lưu ý: `account_balances` là VIEW nên không tự động áp RLS như bảng gốc trong mọi cấu hình — cần kiểm tra bật `security_invoker = true` (Postgres 15+) hoặc filter thêm `user_id = auth.uid()` khi query view này từ client.

## 5. Business logic quan trọng

### 5.1 Cách ghi nhận các nghiệp vụ đặc thù
| Nghiệp vụ | type | account_id | to_account_id | category_id |
|---|---|---|---|---|
| Mua đồ trả bằng Momo | expense | Momo | — | "Ăn uống" |
| Rút Momo → tiền mặt | transfer | Momo | Tiền mặt | — |
| Cho A mượn tiền (từ tiền mặt) | transfer | Tiền mặt | "Cho A mượn" (type=lending) | — |
| A trả nợ | transfer | "Cho A mượn" | Tiền mặt | — |
| Mua trả sau bằng ShopeePay (phát sinh nợ) | expense | "Nợ ShopeePay" (type=debt) | — | category tương ứng |
| Trả nợ ShopeePay | transfer | Tiền mặt | "Nợ ShopeePay" | — |

### 5.2 Công thức summary
- **Tổng tài sản (net worth)** = Σ balance(account.type in [cash, ewallet, bank, lending]) − Σ |balance(account.type = debt)|
- **Tiền khả dụng thực tế** = Σ balance(account.type in [cash, ewallet, bank])
- **Tiền đang cho mượn (chưa thu hồi)** = Σ balance(account.type = lending)
- **Tổng nợ đang mang** = Σ |balance(account.type = debt)|

### 5.3 Filter theo thời gian
Cung cấp preset: Hôm nay / Tuần này / Tháng này / Năm này / Tuỳ chọn (date range picker start-end).
Query: `transaction_date >= start and transaction_date <= end`.

## 6. Auth flow (Google qua Supabase)

1. Supabase Dashboard → Authentication → Providers → bật Google, nhập Client ID/Secret (tạo trên Google Cloud Console, redirect URI lấy từ Supabase).
2. Frontend:
```ts
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${location.origin}/auth/callback` }
})
```
3. Middleware Next.js kiểm tra session, redirect `/login` nếu chưa đăng nhập, dùng `@supabase/ssr` package (khuyến nghị mới nhất thay cho `auth-helpers-nextjs` đã deprecated).

## 7. Các màn hình chính

1. **Login** — nút "Đăng nhập với Google"
2. **Dashboard** — card summary (tổng tài sản, khả dụng, cho mượn, nợ) + chart thu/chi theo filter + danh sách giao dịch gần nhất
3. **Transactions** — bảng/list giao dịch, filter ngày, filter theo account/category, search note, thêm/sửa/xoá
4. **New Transaction** — form: chọn loại (thu/chi/chuyển khoản) → hiện field tương ứng (account, to_account nếu transfer, category nếu không transfer, amount, note, date)
5. **Accounts** — CRUD nguồn tiền, hiển thị balance hiện tại mỗi account
6. **Categories** — CRUD danh mục thu/chi
7. **Reports** — breakdown theo category (pie chart), theo account, theo thời gian (line/bar chart), export CSV (tuỳ chọn)

## 8. Việc cần làm khi setup (checklist cho Claude Code)

- [ ] `npx create-next-app@latest` (TypeScript, App Router, Tailwind)
- [ ] Cài đặt: `@supabase/supabase-js @supabase/ssr @tanstack/react-query react-hook-form zod date-fns recharts`
- [ ] Setup shadcn/ui: `npx shadcn@latest init`
- [ ] Tạo Supabase project, chạy schema SQL ở mục 4 (qua Supabase SQL editor hoặc CLI migration)
- [ ] Generate types: `supabase gen types typescript --project-id <ref> > lib/types/database.types.ts`
- [ ] Setup `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Setup Supabase client (browser + server) theo `@supabase/ssr`
- [ ] Setup middleware bảo vệ route
- [ ] Build từng màn hình theo mục 7, ưu tiên: Login → Accounts → Categories → New Transaction → Dashboard → Transactions list → Reports
- [ ] Responsive: dùng Tailwind breakpoints, layout dạng sidebar trên desktop / bottom nav trên mobile

## 9. Ghi chú thiết kế UI

- Ưu tiên mobile-first vì đây là nhu cầu nhập liệu hàng ngày, form "New Transaction" cần nhanh, gọn (tối thiểu số lần chạm)
- Có thể thêm quick-add floating button (+) ở mobile
- Màu sắc phân biệt: xanh cho income, đỏ cho expense, xanh dương/tím cho transfer
