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
```

`getCategoryBreakdown`: giao dịch không có category (`category_id = null`) gộp vào nhóm `"uncategorized"` /
"Không phân loại" — không được rớt mất khỏi biểu đồ.

## 4.2 Tab "Tổng quan" (`OverviewTab`)

Thứ tự bố cục:

1. **Summary cards** (từ `getNetWorthSummary`): 4 số — Tổng tài sản (net worth, nổi bật nhất), Tiền khả dụng
   thực tế, Đang cho mượn, Tổng nợ đang mang. ⚠️ Tài sản `in_kind` **không** gộp vào các số này (không quy đổi
   VNĐ được) — xem mục 4.4.
2. **Biểu đồ thu/chi theo kỳ**: tabs chọn preset (Hôm nay/Tuần/Tháng/Năm — không có "Tuỳ chọn" ở tab này, khác
   với Reports), mặc định "Tháng". Bar/donut so sánh thu vs chi trong kỳ.
3. **Biểu đồ số dư theo account** (`AccountBreakdownChart`) — toàn bộ account (không lọc theo kỳ, vì số dư luôn
   là hiện tại).
4. **Danh sách tài sản hiện vật** (chỉ hiện nếu có ít nhất 1 account `in_kind`) — liệt kê riêng từng account hiện
   vật kèm số lượng theo đơn vị của nó (không trộn vào chart VNĐ).
5. **Giao dịch gần đây** (6 giao dịch mới nhất) + link "Xem tất cả" sang tab Sổ.

## 4.3 Tab "Báo cáo" (`ReportsTab`)

- Preset ngày đầy đủ 5 lựa chọn theo thứ tự **Tuỳ chọn, Hôm nay, Tuần, Tháng, Năm** (`DATE_RANGE_PRESET_ORDER`) —
  chọn "Tuỳ chọn" hiện thêm 2 date field (từ ngày / đến ngày).
- 3 ô tổng nhanh: Thu / Chi / Chênh lệch (net) trong kỳ đã chọn.
- **Biểu đồ theo danh mục** (pie/donut) với tab con Chi/Thu để chuyển `kind`.
- **Biểu đồ theo account** (giống Overview, không đổi theo kỳ).
- **Xuất CSV**: xuất toàn bộ giao dịch trong kỳ đang lọc, cột: ngày, loại, số tiền, account (nếu transfer thì
  format `"Từ → Đến"`), category, note. Trên mobile, thay `Blob`+`URL.createObjectURL` (chỉ chạy trên web) bằng
  ghi file tạm rồi mở **share sheet** (RN: `expo-sharing` + `expo-file-system`; Flutter: `share_plus` +
  `path_provider`) để người dùng lưu/gửi file CSV.

## 4.4 Vì sao tài sản hiện vật tách riêng khỏi net worth

Không có tỷ giá/giá thị trường cố định lưu trong hệ thống cho vàng/cổ phiếu — số dư của account `in_kind` là
**số lượng** (chỉ, cổ phiếu...), không phải VNĐ, nên không cộng gộp được vào các phép tính tiền tệ (`netWorth`,
`availableCash`...). Nếu tương lai muốn quy đổi ra VNĐ cần thêm nguồn giá real-time — **ngoài phạm vi hiện tại**,
không tự ý thêm vào khi port.

## 4.5 Checklist cuối phase 4

- [ ] 4 summary card đúng công thức, account `in_kind` không ảnh hưởng các số này
- [ ] Đổi preset kỳ ở Tổng quan cập nhật đúng chart thu/chi
- [ ] Danh sách hiện vật chỉ hiện khi có account `in_kind`, đúng đơn vị từng account
- [ ] Báo cáo: preset "Tuỳ chọn" cho chọn khoảng ngày tự do, breakdown category đổi đúng theo tab Thu/Chi
- [ ] Xuất CSV mở được share sheet, nội dung đúng cột và encoding (UTF-8 BOM để Excel đọc đúng tiếng Việt)
