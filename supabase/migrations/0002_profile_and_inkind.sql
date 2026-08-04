-- ================= PROFILES =================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  birth_year int,
  pin_hash text,
  pin_set_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "user manages own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- ================= ACCOUNTS: in-kind type + unit =================
alter table accounts drop constraint accounts_type_check;
alter table accounts add constraint accounts_type_check
  check (type in ('cash','ewallet','bank','lending','debt','in_kind','other'));

alter table accounts add column unit text;

-- ================= TRANSACTIONS: dual-sided transfer amount =================
alter table transactions add column to_amount numeric;
alter table transactions add constraint to_amount_positive
  check (to_amount is null or to_amount > 0);

-- ================= VIEW: account balance hiện tại (cập nhật) =================
-- Vế nhận của transfer dùng to_amount nếu có (chuyển đổi hiện vật khác đơn vị),
-- nếu không có thì dùng amount như cũ — các giao dịch cũ không bị ảnh hưởng.
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
    + coalesce(sum(case when t.type='transfer' and t.to_account_id=a.id then coalesce(t.to_amount, t.amount) else 0 end),0)
    as current_balance
from accounts a
left join transactions t
  on t.account_id = a.id or t.to_account_id = a.id
group by a.id;
