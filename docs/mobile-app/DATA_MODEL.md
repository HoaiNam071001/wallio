# Data Model — Supabase (dùng chung web + mobile)

Backend không cần thay đổi gì để phục vụ mobile — schema dưới đây là **hiện trạng thật** (2 migration đã chạy:
`0001_init.sql` + `0002_profile_and_inkind.sql`), khác spec gốc ở vài điểm quan trọng (đánh dấu ⚠️).

## 1. Bảng `accounts` (nguồn tiền)

```sql
create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('cash','ewallet','bank','lending','debt','in_kind','other')), -- ⚠️ có thêm 'in_kind'
  initial_balance numeric not null default 0,
  is_active boolean not null default true,
  icon text,       -- tên icon Lucide, vd "Wallet" — xem registry ở PHASE_2
  color text,       -- hex #rrggbb
  unit text,        -- ⚠️ mới: chỉ dùng khi type = 'in_kind', vd "chỉ", "cổ phiếu"
  created_at timestamptz not null default now()
);
```

Loại tài khoản (`AccountType`) và ý nghĩa:

| type | Ý nghĩa | Icon/màu mặc định |
|---|---|---|
| `cash` | Tiền mặt | Banknote, `#22c55e` |
| `ewallet` | Ví điện tử (Momo, ShopeePay...) | Smartphone, `#ec4899` |
| `bank` | Tài khoản ngân hàng | Landmark, `#3b82f6` |
| `lending` | Tiền cho người khác mượn (tài sản) | HandCoins, `#f59e0b` |
| `debt` | Khoản nợ đang mang (âm) | Receipt, `#ef4444` |
| `in_kind` | Tài sản hiện vật — vàng, cổ phiếu... (có `unit` riêng) | Coins, `#eab308` |
| `other` | Khác | Wallet, `#64748b` |

## 2. Bảng `categories` (danh mục)

```sql
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income','expense')),
  icon text,
  color text,
  created_at timestamptz not null default now()
);
```

## 3. Bảng `transactions` (giao dịch)

```sql
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense','transfer')),
  amount numeric not null check (amount > 0),         -- vế "đi ra" / thu-chi
  to_amount numeric,                                    -- ⚠️ mới: vế "nhận được" nếu khác đơn vị (transfer 2 loại tài sản)
  account_id uuid not null references accounts(id) on delete restrict,
  to_account_id uuid references accounts(id) on delete restrict, -- chỉ dùng khi type = 'transfer'
  category_id uuid references categories(id) on delete set null, -- null nếu transfer
  note text,
  transaction_date date not null default current_date,
  created_at timestamptz not null default now(),
  constraint transfer_needs_to_account check ((type = 'transfer' and to_account_id is not null) or type != 'transfer'),
  constraint to_amount_positive check (to_amount is null or to_amount > 0)
);

create index idx_transactions_user_date on transactions(user_id, transaction_date);
create index idx_transactions_account on transactions(account_id);
```

**`to_amount` — quan trọng, không có trong spec gốc:** dùng khi transfer giữa 2 tài khoản có "đơn vị" khác nhau
(vd rút Momo 5.000.000đ → mua được 2 chỉ vàng). `amount` luôn là số bị trừ khỏi `account_id`; `to_amount` (nếu có)
là số được cộng vào `to_account_id`. Nếu `to_amount` là `null`, coi hai vế bằng nhau (transfer thông thường, cùng
đơn vị VNĐ) — **tương thích ngược** với các giao dịch tạo trước khi có tính năng này.

## 4. Bảng `profiles` (⚠️ hoàn toàn mới, không có trong spec gốc)

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  birth_date date,
  pin_hash text,           -- SHA-256(salt=user_id : pin), null = chưa đặt PIN
  pin_set_at timestamptz,
  currency_code text not null default 'VND',  -- mã trong danh sách dựng sẵn, xem lib/constants/currencies.ts
  currency_symbol text,    -- ký hiệu tự đặt hiển thị toàn hệ thống; null/rỗng = dùng ký hiệu mặc định của currency_code
  updated_at timestamptz not null default now()
);
```

Nếu user chưa từng lưu hồ sơ, coi như **hồ sơ rỗng** (`pin_hash: null`, `currency_code: 'VND'`, `currency_symbol: null`)
chứ không lỗi — dùng `maybeSingle()` + fallback object phía client (xem `lib/queries/profile.ts`).

`currency_code` + `currency_symbol` quyết định ký hiệu tiền dùng để format MỌI số tiền trong app (trừ account
`in_kind` vẫn dùng `accounts.unit` riêng của nó) — ký hiệu hiệu lực là `currency_symbol` nếu có, không thì tra
mặc định theo `currency_code` trong danh sách dựng sẵn (VND, USD, EUR, JPY, GBP, AUD, CAD, CHF, CNY, HKD, SGD,
THB, KRW, MYR, IDR, PHP, INR, TWD).

## 5. View `account_balances`

```sql
create or replace view account_balances
  with (security_invoker = true)   -- ⚠️ BẮT BUỘC: nếu thiếu, view sẽ bỏ qua RLS của bảng gốc
as
select
  a.id as account_id,
  a.user_id,
  a.name,
  a.type,
  a.initial_balance
    + coalesce(sum(case when t.type='income' and t.account_id=a.id then t.amount else 0 end),0)
    - coalesce(sum(case when t.type='expense' and t.account_id=a.id then t.amount else 0 end),0)
    - coalesce(sum(case when t.type='transfer' and t.account_id=a.id then t.amount else 0 end),0)
    + coalesce(sum(case when t.type='transfer' and t.to_account_id=a.id
        then coalesce(t.to_amount, t.amount) else 0 end),0)   -- ⚠️ dùng to_amount nếu có
    as current_balance
from accounts a
left join transactions t on t.account_id = a.id or t.to_account_id = a.id
group by a.id;
```

Lưu ý khi query từ client (kể cả mobile): view **không tự trả về** `initial_balance`, `icon`, `color`, `unit` —
phải ghép thêm với bảng `accounts` (xem hàm `listAccountsWithBalance` bên dưới) để có đủ dữ liệu hiển thị.

## 6. RLS — áp dụng như nhau cho mọi client (web/mobile)

```sql
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table profiles enable row level security;

create policy "user manages own accounts" on accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user manages own categories" on categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user manages own transactions" on transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user manages own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
```

Không cần logic đặc biệt gì trên mobile cho phần này — cứ đăng nhập đúng user, Supabase client tự lọc theo RLS.

## 7. Nghiệp vụ ghi nhận giao dịch (bảng tra cứu nhanh)

| Nghiệp vụ | type | account_id | to_account_id | to_amount | category_id |
|---|---|---|---|---|---|
| Mua đồ trả Momo | expense | Momo | — | — | "Ăn uống" |
| Rút Momo → tiền mặt | transfer | Momo | Tiền mặt | null (bằng amount) | — |
| Cho A mượn tiền | transfer | Tiền mặt | "Cho A mượn" (type=lending) | null | — |
| A trả nợ | transfer | "Cho A mượn" | Tiền mặt | null | — |
| Mua trả sau bằng ShopeePay | expense | "Nợ ShopeePay" (type=debt) | — | — | category tương ứng |
| Trả nợ ShopeePay | transfer | Tiền mặt | "Nợ ShopeePay" | null | — |
| **Rút tiền mua vàng** ⚠️ | transfer | Momo (5.000.000đ) | "Vàng SJC" (type=in_kind) | 2 (chỉ) | — |
| **Cân đối số dư** ⚠️ | income/expense (tự động) | account đang cân đối | — | — | "Điều chỉnh số dư" (tự tạo) |

## 8. Công thức summary (dashboard)

Định nghĩa `LIQUID_TYPES = {cash, ewallet, bank}`.

```
availableCash = Σ current_balance(account.type ∈ LIQUID_TYPES)
lending       = Σ current_balance(account.type = 'lending')
debt          = Σ |current_balance(account.type = 'debt')|
netWorth      = availableCash + lending - debt
```

⚠️ Khác spec gốc: **`netWorth` KHÔNG cộng tài khoản `in_kind`** (tài sản hiện vật không quy đổi được ra VNĐ vì
không có giá cố định — chỉ hiển thị riêng theo đơn vị của nó, xem PHASE_4).

Tổng thu/chi theo kỳ: filter `transaction_date between start and end`, cộng dồn theo `type` (chỉ `income`/`expense`,
bỏ qua `transfer`).

## 9. Tính số dư "tính đến một ngày" (dùng cho cân đối số dư)

Không phải cột có sẵn — tính bằng cách lấy `initial_balance` rồi duyệt qua mọi transaction có
`transaction_date <= date` liên quan đến account đó:

```
balance = initial_balance
for each transaction row where account_id = X or to_account_id = X, transaction_date <= date:
  if account_id == X:
    balance += amount   if type == 'income'
    balance -= amount   if type in ('expense', 'transfer')   # cả 2 đều làm giảm số dư vế đi ra
  if to_account_id == X and type == 'transfer':
    balance += (to_amount ?? amount)
```

## 10. Cân đối số dư thực tế (balance adjustment)

Không sửa `initial_balance` (sẽ làm sai lệch toàn bộ lịch sử). Thay vào đó:

1. Tính `expected` = số dư tính đến ngày `date` (công thức mục 9).
2. `difference = round(actualBalance - expected)`. Nếu `= 0` → không làm gì.
3. Nếu khác 0: tạo **một giao dịch mới** `type = difference > 0 ? 'income' : 'expense'`,
   `amount = |difference|`, `account_id = accountId`, `transaction_date = date`,
   `category_id` = danh mục "Điều chỉnh số dư" (tự tìm-hoặc-tạo theo `kind`, icon `Scale`, màu `#64748b`).

Nhờ vậy: giao dịch trước ngày cân đối giữ nguyên, từ ngày đó về sau số dư khớp thực tế, giao dịch ghi sau đó vẫn
cộng/trừ bình thường lên trên baseline mới.

## 11. TypeScript types tham chiếu (port sang Dart/RN tương đương)

```ts
export type AccountType = "cash" | "ewallet" | "bank" | "lending" | "debt" | "in_kind" | "other";
export type CategoryKind = "income" | "expense";
export type TransactionType = "income" | "expense" | "transfer";

export type AccountWithBalance = Account & {
  current_balance: number;
  last_activity_date: string | null; // ngày giao dịch gần nhất chạm vào account này — cảnh báo số dư cũ
};
```

`last_activity_date` không có sẵn trong DB — tính client-side bằng cách lấy `max(transaction_date)` trong mọi
transaction có `account_id` hoặc `to_account_id` bằng account đó.
