# Phase 3 — Giao dịch (Transactions)

Mục tiêu: màn hình trung tâm của app — ghi nhận, xem, lọc, sửa, xoá giao dịch. Đây là màn hình dùng nhiều nhất
hàng ngày, ưu tiên tối ưu tốc độ nhập liệu.

## 3.1 Data layer

Port từ `lib/queries/transactions.ts`:

```ts
listTransactions(filters?: {
  startDate?, endDate?, accountId?, categoryId?, type?, search?, limit?, offset?
}): TransactionWithRelations[]
```

- Query kèm join `account`, `to_account`, `category` (chọn sẵn `id,name,type,color,icon,unit` — có `unit` để
  hiển thị đúng đơn vị hiện vật ngay trong danh sách, không cần query phụ).
- `accountId` filter: khớp nếu account đó là **bên đi HOẶC bên nhận** (`account_id.eq.X OR to_account_id.eq.X`)
  — một giao dịch transfer phải hiện ra khi lọc theo bất kỳ vế nào.
- `search`: `ilike` trên `note`.
- Sort mặc định: `transaction_date desc, created_at desc`.
- `createTransaction` / `updateTransaction` / `deleteTransaction`: CRUD chuẩn.
- **Phân trang**: khi cả `limit` và `offset` có mặt, dùng `.range(offset, offset+limit-1)` thay vì `.limit()`
  (offset-based, không phải keyset/cursor — chấp nhận được vì app single-user). Hook `useInfiniteTransactions`
  (`lib/hooks/use-transactions.ts`) bọc bằng TanStack `useInfiniteQuery`, `pageSize` mặc định 20,
  `getNextPageParam` dừng khi trang cuối trả về ít hơn `pageSize`. Hook `useTransactions` (không phân trang) vẫn
  giữ nguyên cho các nơi cần tải trọn (Overview's "gần đây" `limit:6`, Reports' xuất CSV toàn bộ range).

## 3.2 Màn hình danh sách (Transactions tab / "Sổ")

Bố cục theo thứ tự (port `today-hero.tsx` + `transaction-filter.tsx` + `transaction-list.tsx`):

1. **"Today Hero"** — card gradient đầu trang, cái đầu tiên người dùng thấy khi mở app. Ưu tiên **thu/chi HÔM
   NAY** (không phải tổng tài sản — quyết định UX có chủ đích, xem comment gốc). Gồm: lời chào theo giờ trong
   ngày (sáng <11h / trưa <14h / chiều <18h / tối), ngày hiện tại theo locale, số tiền đã chi hôm nay (to, nổi
   bật), 2 ô nhỏ: thu hôm nay + chênh lệch (thu-chi). Có nút mắt để ẩn/hiện số tiền riêng cho scope này.
2. **Bộ lọc**: một nút gọn mở bottom sheet chọn khoảng thời gian (xem PHASE_1/`DateRangeFilter` —
   `components/shared/date-range-filter.tsx`, dùng chung cho cả 3 trang có filter ngày), cộng thêm nút mở rộng
   filter theo account/category/search theo note (`TransactionFilterBar`).
3. **Card "Cơ cấu theo danh mục"** gộp chung tổng thu/chi/còn lại của kỳ đang xem (3 ô nhỏ) + chart cơ cấu theo
   danh mục vào **một card duy nhất** (trước đây là 2 khối tách rời, chiếm nhiều chỗ hơn cần thiết) — có toggle
   Tab thu/chi và toggle loại chart (tròn/ngang, xem `CategoryBreakdownChart`'s `variant` prop và
   `useChartType` hook, `lib/hooks/use-chart-type.ts`). **Mặc định chart dạng ngang** ("bar" — thanh ngang có
   nhãn %, gọn hơn donut), lựa chọn lưu riêng theo từng trang (`wallio:chartType:transactions` /
   `wallio:chartType:reports`) qua localStorage, chọn 1 lần là nhớ mãi.
4. **Danh sách giao dịch**, nhóm theo ngày là hợp lý (web hiện list phẳng sort theo ngày, nhưng nhóm theo ngày là
   cải tiến UX tự nhiên cho mobile). Mỗi dòng compact (icon 36px, padding vừa phải — không dùng icon 44px như
   card giới thiệu): icon category (hoặc icon "chuyển khoản" nếu type=transfer), tên category/mô tả transfer
   (`"Momo → Tiền mặt"`), note rút gọn, số tiền màu theo loại (xanh income / đỏ expense / xanh dương-tím
   transfer), định dạng theo đơn vị account (dùng `formatAccountAmount`, không phải luôn VNĐ).
   **Phân trang kiểu "Xem thêm"**: tải 20 giao dịch/trang qua `useInfiniteTransactions`, nút "Xem thêm" ở cuối
   danh sách gọi `fetchNextPage()` — chọn nút bấm rõ ràng thay vì infinite-scroll tự động (không cần
   IntersectionObserver, tránh tải dư khi cuộn nhanh).
5. Tap vào 1 dòng → dialog/bottom-sheet chi tiết (`TransactionDetailDialog`) với nút Sửa/Xoá.

## 3.3 Màn hình Thêm/Sửa giao dịch — quan trọng nhất

Port từ `components/transactions/transaction-form.tsx`. Đây là form phức tạp nhất trong app, đọc kỹ.

### Chọn loại giao dịch

3 nút lớn dạng chip: **Chi (expense)**, **Thu (income)**, **Chuyển khoản (transfer)** — màu riêng
(`var(--expense)` đỏ, `var(--income)` xanh, `var(--transfer)` xanh dương/tím). Đổi loại reset field không còn
phù hợp: rời `transfer` → xoá `to_account_id`, chọn lại category đầu tiên hợp `kind` mới; vào `transfer` → xoá
`category_id`. **Chỉ reset khi type thực sự đổi**, không reset khi mở form sửa lần đầu (tránh mất dữ liệu có sẵn
khi edit).

### Số tiền — có 2 trường hợp

- **Trường hợp thường** (income/expense, hoặc transfer cùng đơn vị VNĐ): 1 ô nhập `amount`, input dạng bàn phím số
  lớn (auto focus), hiện đơn vị phù hợp (mặc định "đ").
- **Trường hợp "dual amount"** ⚠️ (chỉ xảy ra khi `type === 'transfer'` VÀ ít nhất 1 trong 2 account là
  `in_kind`): hiện **2 ô riêng** — "Số tiền từ [tên account nguồn]" (đơn vị của account nguồn: "đ" hoặc `unit`
  của nó) và "Số nhận vào [tên account đích]" (đơn vị của account đích). Đây là cách xử lý chuyển đổi hiện vật
  khác đơn vị (vd rút 5.000.000đ Momo → nhận 2 chỉ vàng). Nếu rời khỏi trường hợp dual-amount, tự xoá `to_amount`
  (coi 2 vế lại bằng nhau).
- Validate: `amount` phải dương; nếu là dual-amount thì `to_amount` cũng bắt buộc dương (validate riêng lúc
  submit, không chỉ ở schema, vì field này ẩn/hiện động).

### Danh mục (chỉ hiện khi type ≠ transfer)

Grid chip 4-5 cột, mỗi ô = icon tròn màu + tên category, lọc theo `kind` khớp với `type` đang chọn (income→income,
expense→expense). Nếu không có category nào thuộc loại đó, hiện gợi ý tạo mới thay vì để trống.

### Chọn nguồn tiền

- income/expense: 1 selector "Nguồn tiền" — **loại trừ account `in_kind`** khỏi danh sách chọn (hiện vật không
  dùng cho thu/chi trực tiếp, chỉ dùng qua transfer).
- transfer: 2 selector "Từ" / "Đến", selector "Đến" loại trừ chính account đã chọn ở "Từ" (không tự chuyển cho
  chính mình) — validate thêm ở schema: `to_account_id !== account_id`.

### Ngày & ghi chú

Date picker + 2 nút tắt "Hôm nay"/"Hôm qua". Ghi chú tự do (textarea), optional.

### Validate tổng thể (zod schema tương đương cần port)

```
type: enum(income, expense, transfer)
amount: number > 0
to_amount: number > 0, optional
account_id: string, required
to_account_id: required nếu type=transfer, và phải khác account_id
category_id: optional
transaction_date: required
+ validate riêng lúc submit: nếu dual-amount mà thiếu to_amount → báo lỗi field đó
```

## 3.4 Quick-add FAB

Nút "+" nổi cố định (xem PHASE_1 §1.4) dẫn thẳng vào màn Thêm giao dịch mới — ẩn đi khi đang đứng chính trên màn
đó (tránh nút thừa). Đây là entry point chính để ghi giao dịch hàng ngày, cần mở nhanh nhất có thể (tránh nhiều
bước trung gian).

## 3.5 Checklist cuối phase 3

- [ ] Ghi expense/income cơ bản, đúng account/category, hiện đúng trong danh sách
- [ ] Transfer thường (cùng đơn vị) hoạt động đúng, cả 2 account cập nhật số dư
- [ ] Transfer dual-amount (vd Momo → vàng): 2 ô nhập tách biệt, đúng đơn vị từng bên, lưu đúng `to_amount`
- [ ] Sửa giao dịch có sẵn: mở form không bị mất `category_id`/`to_account_id` do reset nhầm
- [ ] Xoá giao dịch, số dư account cập nhật lại đúng
- [ ] Filter theo ngày/account/category/loại/search hoạt động đúng, đặc biệt filter theo account phải bắt được cả 2 vế của transfer
- [ ] FAB "+" hoạt động ở mọi màn, ẩn đúng khi đang ở màn thêm mới
- [ ] "Xem thêm" tải đúng trang tiếp theo, không trùng/thiếu giao dịch khi filter thay đổi
- [ ] Toggle chart tròn/ngang ở card cơ cấu theo danh mục, chọn xong load lại app vẫn nhớ lựa chọn
