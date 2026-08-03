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
create or replace view account_balances
  with (security_invoker = true)
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
