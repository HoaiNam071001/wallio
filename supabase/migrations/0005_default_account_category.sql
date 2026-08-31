-- ================= MẶC ĐỊNH CHO FORM GHI KHOẢN MỚI =================
-- Người dùng đánh dấu tối đa 1 nguồn tiền và 1 danh mục cho mỗi loại (chi tiêu /
-- thu nhập); modal "Ghi khoản mới" chọn sẵn các mục này để bớt thao tác.
-- Ràng buộc "tối đa 1" do unique partial index đảm bảo ở DB, không chỉ ở UI.
alter table accounts add column is_default boolean not null default false;

create unique index idx_accounts_one_default
  on accounts(user_id)
  where is_default;

alter table categories add column is_default boolean not null default false;

create unique index idx_categories_one_default_per_kind
  on categories(user_id, kind)
  where is_default;
