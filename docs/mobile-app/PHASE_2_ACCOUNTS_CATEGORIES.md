# Phase 2 — Nguồn tiền (Accounts) & Danh mục (Categories)

Mục tiêu: CRUD đầy đủ 2 loại dữ liệu nền tảng mà mọi giao dịch phụ thuộc vào. Làm trước Transactions vì form giao
dịch cần chọn account/category có sẵn.

## 2.1 Data layer (port nguyên hàm, đổi Supabase JS → SDK tương ứng)

Từ `lib/queries/accounts.ts` — port các hàm:

- `listAccounts()` — tất cả account của user, sort theo `created_at`.
- `listAccountBalances()` — đọc view `account_balances`.
- `listAccountsWithBalance()` — **ghép 3 nguồn song song**: `listAccounts` + `listAccountBalances` +
  `listLastActivityDates` (tự tính `max(transaction_date)` theo từng account từ toàn bộ transactions, vì cột này
  không có sẵn trong DB) → trả về `AccountWithBalance[]` đầy đủ để hiển thị.
- `getAccountBalanceAsOf(accountId, date)` — số dư tính đến hết một ngày (dùng cho cân đối số dư, xem 2.4).
- `createAccount` / `updateAccount` / `deleteAccount` — CRUD chuẩn qua Supabase, RLS tự lọc theo `user_id`.

Từ `lib/queries/categories.ts` — CRUD chuẩn tương tự, không có gì đặc biệt.

Nếu dùng React Query (RN) / Riverpod `AsyncNotifier` (Flutter), giữ đúng pattern hook hiện có:
`use-accounts.ts`, `use-categories.ts` — mutation nào cũng nên `invalidate` query liên quan (accounts, account
balances, và cả transactions nếu ảnh hưởng số dư).

## 2.2 Màn hình Accounts

Danh sách account dạng card, mỗi card hiện: icon (nền màu nhạt của màu account), tên, loại (nhãn theo
`accountTypeOptions(t)`), số dư hiện tại định dạng theo đơn vị (xem 2.3), và **cảnh báo nếu `last_activity_date`
quá cũ** (gợi ý người dùng cân đối lại số dư — đây là lý do tồn tại của field này).

Form thêm/sửa account (`AccountForm`):

- Chọn `type` từ 7 loại (`accountTypeOptions`, xem bảng ở [DATA_MODEL.md](./DATA_MODEL.md#1-bảng-accounts-nguồn-tiền)) — icon/màu mặc định tự điền theo `ACCOUNT_TYPE_META`, người dùng có thể ghi đè bằng icon/color picker riêng (list icon ở PHASE_1 §1.7, màu ở PHASE_1 §1.5).
- `name`, `initial_balance` (số dư ban đầu tại thời điểm tạo — không đổi được sau khi đã có giao dịch, chỉ nên
  sửa qua "cân đối số dư" để không phá lịch sử).
- **Nếu `type === 'in_kind'`**: hiện thêm field `unit` (text tự do, vd "chỉ", "lượng", "cổ phiếu") — bắt buộc để
  hiển thị số lượng có ý nghĩa (`formatAccountAmount`, xem 2.3).
- `is_active`: ẩn account khỏi các danh sách chọn mới nhưng giữ lại lịch sử giao dịch cũ (soft toggle, không xoá).
- Xoá account: `on delete restrict` ở FK — **không xoá được nếu còn giao dịch tham chiếu**; UI cần báo lỗi rõ
  ràng thay vì crash, gợi ý xoá/chuyển giao dịch trước.

## 2.3 Hiển thị số tiền theo loại account

Port hàm `formatAccountAmount` (`lib/utils/currency.ts`):

```
nếu account.type !== 'in_kind':  format kiểu VNĐ, vd "1.250.000 ₫"
nếu account.type === 'in_kind':  format số + đơn vị tự khai, vd "2 chỉ" (không có ký hiệu tiền tệ)
```

Account `type = 'debt'` hiển thị số dư **trị tuyệt đối kèm dấu trừ thủ công** ở UI (số dư lưu trong DB có thể âm
về mặt kế toán nhưng cách trình bày cho người dùng là "đang nợ bao nhiêu", không phải số âm khó đọc).

## 2.4 Cân đối số dư thực tế (Balance Adjustment)

Tính năng độc lập, mở từ mỗi account card (icon cân `Scale`). Port từ `lib/queries/balance-adjustment.ts` +
`components/accounts/balance-adjust-dialog.tsx`. Flow UI:

1. Chọn ngày cần chốt (mặc định hôm nay, max = hôm nay).
2. App tự tính và hiện **số dư app đang tính** tại ngày đó (`getAccountBalanceAsOf`, xem
   [DATA_MODEL.md §9](./DATA_MODEL.md#9-tính-số-dư-tính-đến-một-ngày-dùng-cho-cân-đối-số-dư)) — chỉ đọc, không sửa.
3. Người dùng nhập **số tiền thực tế đang có** (cho phép âm, vd account nợ).
4. App preview ngay: nếu = 0 → "khớp rồi, không cần ghi gì"; nếu dương → sẽ ghi thêm 1 khoản **thu**; nếu âm →
   sẽ ghi thêm 1 khoản **chi**, đúng bằng phần chênh lệch, vào category tự động **"Điều chỉnh số dư"** (icon
   `Scale`, màu `#64748b`, tự tìm-hoặc-tạo theo `kind`).
5. Có ô note tuỳ chọn (mặc định "Cân đối số dư thực tế").
6. Submit → gọi `adjustAccountBalance` (logic đầy đủ ở [DATA_MODEL.md §10](./DATA_MODEL.md#10-cân-đối-số-dư-thực-tế-balance-adjustment)).

## 2.5 Màn hình Categories

CRUD đơn giản hơn account: `name`, `kind` (income/expense — quyết định category chỉ xuất hiện khi chọn đúng loại
giao dịch tương ứng ở form transaction), icon, color. Danh sách nên nhóm/tab theo `kind` để dễ quản lý khi nhiều
danh mục. Không có khái niệm "is_active" hay xoá bị chặn kiểu account — `category_id` trên transaction dùng
`on delete set null`, nên xoá category không xoá mất giao dịch, chỉ làm giao dịch cũ mất phân loại (hiển thị
"Không phân loại").

## 2.6 Vị trí truy cập trên mobile

Không có tab riêng — cả 2 màn hình này nằm trong tab "Ví" (`wallet`) của màn Profile (2 widget card:
`AccountsWidgetCard` hiện tối đa 4 account + link "Xem tất cả" sang màn Accounts đầy đủ; `CategoriesWidgetCard`
tương tự hiện tối đa 8 category). Xem chi tiết bố cục ở PHASE_5.

## 2.7 Checklist cuối phase 2

- [ ] Tạo/sửa/xoá account đủ 7 loại, số dư hiển thị đúng đơn vị từng loại
- [ ] Tạo account `in_kind` với `unit` tuỳ ý, số dư hiện đúng "2 chỉ" thay vì "2 ₫"
- [ ] Cân đối số dư: preview đúng chênh lệch, ghi đúng 1 giao dịch, category tự tạo đúng 1 lần (không nhân bản)
- [ ] Tạo/sửa/xoá category, lọc đúng theo income/expense
- [ ] Xoá account đang có giao dịch → báo lỗi rõ ràng, không crash
