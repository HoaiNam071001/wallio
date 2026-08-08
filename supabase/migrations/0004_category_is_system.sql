-- ================= CATEGORIES: đánh dấu danh mục hệ thống =================
-- Trước đây danh mục "Điều chỉnh số dư" được tìm/tạo dựa theo NAME, nên khi user
-- đổi tên danh mục này, lần cân đối số dư kế tiếp không tìm thấy nữa và tự tạo
-- thêm một bản ghi trùng. Thêm cờ is_system để nhận diện độc lập với tên, và
-- unique index để DB đảm bảo mỗi user chỉ có tối đa 1 danh mục hệ thống / kind.
alter table categories add column is_system boolean not null default false;

-- Gộp các bản ghi "Điều chỉnh số dư" trùng lặp đã lỡ tạo trước đó: giữ lại bản
-- ghi cũ nhất theo (user_id, kind), chuyển giao dịch của các bản ghi trùng
-- sang bản ghi được giữ, rồi xoá bản ghi trùng.
with ranked as (
  select
    id,
    user_id,
    kind,
    row_number() over (
      partition by user_id, kind
      order by created_at asc
    ) as rn
  from categories
  where name = 'Điều chỉnh số dư'
),
duplicates as (
  select d.id as duplicate_id, k.id as keep_id
  from ranked d
  join ranked k on k.user_id = d.user_id and k.kind = d.kind and k.rn = 1
  where d.rn > 1
)
update transactions t
set category_id = duplicates.keep_id
from duplicates
where t.category_id = duplicates.duplicate_id;

with ranked as (
  select
    id,
    user_id,
    kind,
    row_number() over (
      partition by user_id, kind
      order by created_at asc
    ) as rn
  from categories
  where name = 'Điều chỉnh số dư'
)
delete from categories
using ranked
where categories.id = ranked.id and ranked.rn > 1;

update categories
set is_system = true
where name = 'Điều chỉnh số dư';

create unique index idx_categories_one_system_per_kind
  on categories(user_id, kind)
  where is_system;
