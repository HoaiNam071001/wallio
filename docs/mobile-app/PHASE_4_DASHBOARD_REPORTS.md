# Phase 4 — Dashboard (Tổng quan & Báo cáo)

Trên web, route `/dashboard` gồm 2 tab con: **Tổng quan** (`OverviewTab`) và **Báo cáo** (`ReportsTab`). Trên
mobile giữ nguyên làm 2 tab con trong màn "Tổng quan" (tab thứ 2 của bottom bar).

## 4.1 Data layer

Port từ `lib/queries/summary.ts`:

```ts
getNetWorthSummary(): { netWorth, availableCash, lending, debt }   // công thức: xem DATA_MODEL.md §8
getPeriodTotals(startDate, endDate): { income, expense, net }       // chỉ tính type income/expense, bỏ transfer
getCategoryBreakdown(startDate, endDate, kind): CategoryBreakdownItem[]   // gộp theo category, sort giảm dần theo total
getAccountBreakdown(): AccountBreakdownItem[]   // = listAccountsWithBalance, map lại field cần cho chart
getCategoryComparison(currentStart, currentEnd, previousStart, previousEnd, kind): CategoryComparisonItem[]
getDailyTotals(startDate, endDate): DailyTotalItem[]   // { date, income, expense } — 1 dòng/ngày
```

`getCategoryBreakdown`: giao dịch không có category (`category_id = null`) gộp vào nhóm `"uncategorized"` /
"Không phân loại" — không được rớt mất khỏi biểu đồ.

`getCategoryComparison`: gọi `getCategoryBreakdown` 2 lần (kỳ hiện tại + kỳ so sánh) rồi gộp kiểu **full outer
join** theo `categoryId` — danh mục chỉ phát sinh ở một trong hai kỳ vẫn được liệt kê (kỳ còn lại nhận `total =
0`) thay vì rớt mất. `changePercent = null` khi kỳ so sánh bằng 0 (tránh chia cho 0) — UI hiện nhãn "Mới" thay
vì phần trăm. Hai kỳ so sánh: "kỳ trước" = `shiftDateRange(range, -1)` đã có sẵn (đúng độ dài, đúng đơn vị lịch
với preset); "cùng kỳ năm trước" = hàm mới `getSameRangeLastYear` (lùi cả 2 mốc đúng 1 năm bằng `subYears`, luôn
trả về dạng "custom" vì không chắc còn khớp preset gốc).

`getDailyTotals`: tự lấp đủ **mọi ngày** trong khoảng `[startDate, endDate]` bằng `eachDayOfInterval`, kể cả
ngày không có giao dịch nào (`income = expense = 0`) — không để chart tự bỏ qua ngày trống, tránh trục ngày bị
lệch/gây hiểu nhầm.

## 4.2 Tab "Tổng quan" (`OverviewTab`)

Thứ tự bố cục:

1. **Summary cards** (từ `getNetWorthSummary`): 4 số — Tổng tài sản (net worth, nổi bật nhất), Tiền khả dụng
   thực tế, Đang cho mượn, Tổng nợ đang mang. ⚠️ Tài sản `in_kind` **không** gộp vào các số này (không quy đổi
   VNĐ được) — xem mục 4.4.
2. **Biểu đồ thu/chi theo kỳ**: dùng chung component chọn khoảng thời gian `DateRangeFilter` (xem §4.3 — một
   nút gọn mở bottom sheet có 4 chip preset + phần chọn khoảng ngày luôn hiển thị, đã đồng bộ với Reports/Sổ thu
   chi thay vì tabs riêng không chọn được khoảng ngày như trước), mặc định "Tháng". Bar/donut so sánh thu vs chi trong kỳ.
3. **Biểu đồ số dư theo account** (`AccountBreakdownChart`) — toàn bộ account (không lọc theo kỳ, vì số dư luôn
   là hiện tại). Bấm vào một dòng mở **màn chi tiết nguồn tiền** (PHASE_2 §2.2.3).
4. **Danh sách tài sản hiện vật** (chỉ hiện nếu có ít nhất 1 account `in_kind`) — liệt kê riêng từng account hiện
   vật kèm số lượng theo đơn vị của nó (không trộn vào chart VNĐ). Cũng bấm được để mở màn chi tiết nguồn tiền.
5. **Giao dịch gần đây** (6 giao dịch mới nhất) + link "Xem tất cả" sang tab Sổ.

## 4.3 Tab "Báo cáo" (`ReportsTab`)

- Chọn khoảng thời gian qua `DateRangeFilter` (`components/shared/date-range-filter.tsx`) — một nút gọn hiện
  lựa chọn hiện tại (vd "Tháng 8, 2026"), bấm mở bottom sheet gồm 3 phần, **phần chọn ngày luôn hiển thị**
  (không còn preset "Tuỳ chọn" phải bấm vào mới hiện):
  1. **Hàng chip preset ngang** 4 ô đều nhau: **Hôm nay, Tuần, Tháng, Năm** (`DATE_RANGE_PRESET_ORDER`, đã bỏ
     `"custom"` khỏi mảng này). Bấm chip **chỉ điền sẵn** mốc đầu/cuối + đưa lịch về đúng khoảng đó, **chưa
     submit**.
  2. **2 thẻ mốc đầu/cuối** đặt cạnh nhau, ngăn bởi mũi tên `→` (nhãn "Từ ngày"/"Đến ngày" + ngày `dd/MM/yyyy`
     + thứ trong tuần, thẻ đang chỉnh có viền/nền brand) — thay cho 2 pill 1 dòng bị cắt chữ trước đây. Bấm thẻ
     nào thì lịch nhảy tới mốc đó.
  3. **Lịch** (`Calendar`): **mọi ngày đều bấm được** (không truyền `minDate`/`maxDate` — kể cả ngày tương
     lai, vì preset Tuần/Tháng/Năm vốn đã có mốc cuối ở tương lai). Chọn xong mốc đầu tự chuyển sang mốc cuối;
     đang chỉnh mốc cuối mà bấm ngày trước mốc đầu thì hiểu là **nới mốc đầu về trước** chứ không bỏ qua cú
     bấm. Lịch tô sáng cả dải ngày giữa 2 mốc (`rangeStart`/`rangeEnd`). Sửa tay trên lịch làm `preset` chuyển
     thành `"custom"` (không chip nào còn active).
  Mọi thay đổi chỉ có hiệu lực khi bấm **"Áp dụng"** (draft nội bộ, đóng sheet giữa chừng = huỷ). Khi mở sheet,
  draft được quy về đúng khoảng của preset đang lọc (`withPresetDates`) để 2 thẻ ngày/lịch không hiện mốc cũ.
  Component này dùng chung cho cả 4 màn có filter ngày (Sổ thu chi, Báo cáo, Tổng quan, chi tiết nguồn tiền —
  PHASE_2 §2.2.3) — thay cho 3 kiểu UI khác nhau (chip cuộn ngang, 2 kiểu tabs) trước đây, tối ưu cho mobile hơn.
- **Nút prev/next hai bên nút trigger** (`ChevronLeft`/`ChevronRight`, hàm `shiftDateRange` trong
  `lib/utils/date-range.ts`): lùi/tiến một bước theo đúng đơn vị đang chọn, áp dụng ngay (không qua sheet/Áp
  dụng) —
  - "Hôm nay" hoặc một ngày cụ thể → lùi/tiến 1 ngày.
  - "Tuần" → lùi/tiến 7 ngày, luôn giữ khung Thứ 2 → Chủ nhật.
  - "Tháng" → lùi/tiến đúng 1 tháng dương lịch (dùng `startOfMonth`/`endOfMonth` chứ không cộng/trừ số ngày cố
    định, để tháng 28-31 ngày không bị lệch).
  - "Năm" → lùi/tiến đúng 1 năm dương lịch.
  - Khoảng tuỳ chọn không khớp preset nào (vd chọn tay 10 ngày bất kỳ trên lịch) → lùi/tiến đúng bằng độ dài
    khoảng đang chọn, trượt sang khối ngày liền kề (không chồng lấn).
  Nhãn trên nút trigger đọc theo đúng mốc `customStart`/`customEnd` đang lọc (không phải "hôm nay" cố định) —
  vd bấm next từ tháng hiện tại sẽ đổi nhãn thành tên tháng kế tiếp; preset "Hôm nay"/"Tuần" chỉ hiện chữ "Hôm
  nay"/"Tuần này" khi khoảng đang lọc thật sự trùng ngày/tuần hiện tại, lệch khỏi đó thì hiện ngày/khoảng ngày
  cụ thể.
- 3 ô tổng nhanh: Thu / Chi / Chênh lệch (net) trong kỳ đã chọn.
- **Biểu đồ cột thu/chi theo ngày** (`DailyTotalsChart`, `components/charts/daily-totals-chart.tsx`) — component
  Recharts `BarChart` thật đầu tiên trong app (trước đó chỉ có donut `CategoryBreakdownChart` dùng Recharts,
  các "chart" còn lại đều là thanh CSS tự vẽ). Dữ liệu từ `getDailyTotals`, một cột thu (`var(--income)`) + một
  cột chi (`var(--expense)`) mỗi ngày trong kỳ đang lọc. Tab con **Chi / Thu / Cả hai** (`view` prop, mặc định
  "Cả hai") ẩn/hiện từng cột và dòng tương ứng trong tooltip — cùng vị trí với tab Chi/Thu của card "Theo danh
  mục" bên dưới, nhưng là state độc lập (đổi tab ở card này không ảnh hưởng card kia). Khoảng dài (preset Năm ≈
  365 ngày) được bọc trong container cuộn ngang, mỗi ngày giữ tối thiểu ~28px để cột không bị bóp quá hẹp mất
  khả năng đọc.
  **⚠️ Chiều cao cột không bị ẩn theo tuỳ chọn "ẩn số tiền"** (`useAmountVisibility`) — giống `IncomeExpenseChart`
  ở tab Tổng quan, chỉ nhãn trục Y và tooltip bị che thành "••••••", vì độ cao cột vẫn cần thể hiện đúng xu
  hướng tương đối dù đang ẩn số tuyệt đối.
- **Biểu đồ theo danh mục**: toggle **tròn (pie/donut) / ngang (bar, mặc định)** — cùng component
  `CategoryBreakdownChart` với Sổ thu chi (`variant` prop), lựa chọn loại chart lưu riêng cho trang Báo cáo
  (`wallio:chartType:reports`, xem PHASE_3 §3.2) — với tab con Chi/Thu để chuyển `kind`.
- **So sánh theo danh mục** (`CategoryComparisonCard`, `components/dashboard/category-comparison-card.tsx`) —
  đặt ngay dưới card "Theo danh mục", dùng chung `kind` (Chi/Thu) với card đó. Có toggle 1-trong-2 kiểu so sánh
  (không hiện đồng thời cả hai, tránh rối trên mobile): **"So với kỳ trước"** hoặc **"So với cùng kỳ năm
  trước"** (xem `getCategoryComparison` ở §4.1). Mỗi dòng danh mục hiện tổng kỳ hiện tại, tổng kỳ so sánh (chữ
  nhỏ, mờ), và một chip xu hướng: mũi tên lên/màu xanh (`text-income`) khi tăng, mũi tên xuống/màu đỏ
  (`text-expense`) khi giảm, gạch ngang/xám khi gần như không đổi (`|changePercent| < 0.5%`), hoặc nhãn "Mới"
  khi kỳ so sánh bằng 0. **Màu xu hướng theo hướng tăng/giảm của con số, không đảo theo income/expense** — chi
  tiêu tăng vẫn tô xanh giống thu nhập tăng (quy ước giống mũi tên giá cổ phiếu, đã chốt với người dùng khi làm
  tính năng này thay vì tô đỏ cho "chi tiêu tăng = xấu").
- **Biểu đồ theo account** (giống Overview, không đổi theo kỳ).
- **Xuất/Nhập CSV** (`lib/utils/csv-export.ts` + `csv-import.ts`, `components/reports/csv-import-dialog.tsx`):
  xem §4.4 — định dạng mới tự mô tả (accounts + categories + transactions trong 1 file), thay cho bản cũ chỉ
  xuất transaction rows. Trên mobile, thay `Blob`+`URL.createObjectURL` (chỉ chạy trên web) bằng ghi file tạm rồi
  mở **share sheet** để xuất (RN: `expo-sharing` + `expo-file-system`; Flutter: `share_plus` + `path_provider`),
  và **document picker** để chọn file nhập vào (RN: `expo-document-picker`; Flutter: `file_picker`).

## 4.4 Xuất/Nhập CSV — định dạng và luồng nhập

**Định dạng file** (`buildWallioExportCsv`): một file CSV nhiều phần, đánh dấu bằng marker dòng riêng, giữ quy
ước tương thích Excel cũ (UTF-8 BOM, mọi field đều quote + escape `"`):

```
#WALLIO_EXPORT v1
#RANGE,<startDate>,<endDate>
#ACCOUNTS
id,name,type,unit,initial_balance,current_balance
acc_1,"Tiền mặt",cash,,500000,320000
#CATEGORIES
id,name,kind
cat_1,"Ăn uống",expense
#TRANSACTIONS
id,date,type,amount,to_amount,account,to_account,category,note
tx_1,2026-08-01,expense,50000,,acc_1,,cat_1,"Cà phê"
```

- `#TRANSACTIONS` tham chiếu account/category bằng **id sinh riêng cho file này** (`acc_N`/`cat_N`, ổn định
  trong phạm vi 1 lần export), không dùng tên hiển thị — vì 2 nguồn tiền có thể trùng tên. `name` vẫn có trong
  `#ACCOUNTS`/`#CATEGORIES` để hiển thị và làm giá trị mặc định khi tạo account đích mới.
- `current_balance` trên `#ACCOUNTS` chỉ để **hiển thị/đối chiếu** trong dialog nhập, không tự nhập lại — số dư
  đích được dựng lại từ `initial_balance` + các transaction thực sự được chọn nhập.
- Xuất luôn theo khoảng thời gian đang lọc trên Báo cáo (`startDate`/`endDate` hiện tại), gồm cả account +
  category + transaction — không chỉ riêng transaction rows như bản cũ.

**Luồng nhập** (`parseWallioExportCsv` + `CsvImportDialog` + `useImportWallioCsv`):

1. Parse: tách theo 3 marker (`#ACCOUNTS`/`#CATEGORIES`/`#TRANSACTIONS`) rồi parse CSV từng phần (dùng
   `papaparse`, `header: true`). Sai/thiếu marker → báo lỗi toàn bộ file ngay. Transaction nào có account/
   category không xác định được trong file → đánh dấu `resolvable: false`, hiện cảnh báo trong UI, tự động loại
   khỏi lựa chọn thay vì fail cả import.
2. Dialog review hiện 2 danh sách, **mỗi dòng có checkbox riêng, mặc định TẤT CẢ đều được chọn**:
   - **Accounts**: checkbox chọn/bỏ + dropdown map: **"Tạo mới"** (mặc định) hoặc map tới một account **có sẵn**
     của người đang nhập. Bỏ chọn 1 account → mọi transaction tham chiếu account đó (kể cả 2 vế của transfer) tự
     động bị loại theo, không cần thao tác thủ công từng dòng.
   - **Transactions**: checkbox riêng, nhưng **trạng thái chọn thật sự** (`effectiveSelected`) còn phụ thuộc cả
     2 account liên quan (đặc biệt transfer — **bắt buộc cả 2 vế đều được chọn**, khớp với ràng buộc DB
     `transfer_needs_to_account`; 1 vế bị loại thì cả dòng transfer bị loại, không insert được nửa vời).
3. **Vì sao mặc định chọn hết = khớp số dư gốc**: nếu map "Tạo mới", nhập đủ `initial_balance` + 100% transaction
   đã chọn tái tạo đúng `current_balance` của account nguồn (theo công thức view `account_balances`, xem
   DATA_MODEL.md). Nếu map vào account **có sẵn**, transaction nhập vào sẽ cộng dồn lên lịch sử sẵn có của
   account đó — dialog hiện dòng tính toán trước: `Sau khi nhập: <số dư hiện có> + <net các dòng đã chọn> =
   <số dư sau khi nhập>` để người dùng biết trước, không tự động khớp với số dư nguồn trong trường hợp này.
4. Category không có UI review riêng — mỗi category trong file tự khớp theo `name`+`kind` (không phân biệt hoa
   thường) với category sẵn có của người nhập, không khớp được thì tự tạo mới; không có rủi ro sai số dư nên
   không cần thao tác thủ công.
5. Submit: tạo account mới (nếu có) → build map `sourceId → account đích` → khớp/tạo category → tạo hàng loạt
   transaction (`bulkCreateTransactions`). Supabase-js không có transaction đa bảng phía client — nếu bước tạo
   transaction lỗi, best-effort xoá lại các account vừa tạo trong lần import đó (`bulkDeleteAccounts`) rồi báo
   lỗi; chấp nhận không atomic 100% vì đây là app single-user.

## 4.5 Vì sao tài sản hiện vật tách riêng khỏi net worth

Không có tỷ giá/giá thị trường cố định lưu trong hệ thống cho vàng/cổ phiếu — số dư của account `in_kind` là
**số lượng** (chỉ, cổ phiếu...), không phải VNĐ, nên không cộng gộp được vào các phép tính tiền tệ (`netWorth`,
`availableCash`...). Nếu tương lai muốn quy đổi ra VNĐ cần thêm nguồn giá real-time — **ngoài phạm vi hiện tại**,
không tự ý thêm vào khi port.

## 4.6 Checklist cuối phase 4

- [ ] 4 summary card đúng công thức, account `in_kind` không ảnh hưởng các số này
- [ ] Đổi preset kỳ ở Tổng quan cập nhật đúng chart thu/chi
- [ ] Danh sách hiện vật chỉ hiện khi có account `in_kind`, đúng đơn vị từng account
- [ ] Báo cáo: chọn khoảng ngày tự do bằng 2 thẻ Từ/Đến + lịch (chỉ áp dụng khi bấm "Áp dụng"), breakdown
      category đổi đúng theo tab Thu/Chi
- [ ] Xuất CSV: file có đủ 3 phần accounts/categories/transactions, đúng khoảng thời gian đang lọc, mở được share
      sheet, encoding đúng (UTF-8 BOM để Excel đọc đúng tiếng Việt)
- [ ] Nhập CSV: mặc định chọn hết tái tạo đúng số dư khi map "Tạo mới"; bỏ chọn 1 account loại đúng các giao dịch
      liên quan (cả 2 vế transfer); map vào account có sẵn hiện đúng dòng tính số dư sau khi nhập
