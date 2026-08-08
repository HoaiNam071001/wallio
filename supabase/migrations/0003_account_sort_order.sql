-- ================= ACCOUNTS: thứ tự hiển thị tuỳ chỉnh =================
-- Cho phép người dùng kéo-thả sắp xếp lại nguồn tiền (màn hình Accounts, chế độ "reorder").
-- Backfill theo created_at để giữ nguyên thứ tự hiện tại trước khi có sort_order.
alter table accounts add column sort_order integer not null default 0;

with ordered as (
  select id, row_number() over (partition by user_id order by created_at asc) - 1 as rn
  from accounts
)
update accounts
set sort_order = ordered.rn
from ordered
where accounts.id = ordered.id;

create index idx_accounts_user_sort_order on accounts(user_id, sort_order);
