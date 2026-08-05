# Phase 5 — Hồ sơ, Cài đặt & Hoàn thiện

## 5.1 Màn hình Profile (tab "Tôi")

Port từ `app/(dashboard)/profile/page.tsx`. Bố cục: header card (avatar Google + tên + email + nút đăng xuất) ở
trên cùng, luôn hiện; bên dưới là **2 tab con**:

### Tab "Ví" (wallet)

- `AccountsWidgetCard`: tối đa 4 account đầu tiên, mỗi dòng icon + tên + số dư (account `debt` hiện dấu trừ thủ
  công), link "Xem tất cả" → màn Accounts đầy đủ (PHASE_2).
- `CategoriesWidgetCard`: tối đa 8 category dạng chip, link "Xem tất cả" → màn Categories đầy đủ (PHASE_2).

Đây là **lối vào duy nhất** tới quản lý Accounts/Categories trên mobile (không có tab riêng ở bottom bar).

### Tab "Cá nhân" (user)

- **Thông tin cá nhân**: `display_name` (text), `birth_date` (date, max = hôm nay). Lưu qua `upsertProfile`.
- **PIN**: nếu đã có PIN, hiện badge "Đã bật khoá PIN". Form đặt/đổi PIN: 2 ô (PIN mới + xác nhận), validate đúng
  6 chữ số và khớp nhau, hash rồi lưu `pin_hash` + `pin_set_at`. Đây là nơi **tạo PIN lần đầu** — trước khi có
  PIN, PIN Gate (PHASE_1 §1.3) không kích hoạt.
- **Đơn vị tiền** (`CurrencyCard`, tách riêng khỏi Preferences vì lưu DB chứ không phải tuỳ chọn local): dropdown
  chọn từ danh sách dựng sẵn (`lib/constants/currencies.ts`, ~18 đơn vị hay dùng — VND, USD, EUR, JPY, GBP...),
  mỗi lựa chọn hiện tên (theo ngôn ngữ đang chọn, khoá i18n `currency.<code>.name`) + ký hiệu mặc định. Bên dưới
  có ô **ký hiệu tuỳ chỉnh** (`profiles.currency_symbol`) để ghi đè ký hiệu mặc định — để trống thì dùng lại ký
  hiệu mặc định của đơn vị đang chọn (VND để trống thì ký hiệu vẫn là "₫" như cũ, không đổi hành vi mặc định).
  Đổi 1 trong 2 ô chỉ cập nhật state cục bộ; nút **Lưu** chỉ hiện khi có thay đổi chưa lưu (so với
  `profiles.currency_code`/`currency_symbol` hiện tại) — bấm mới ghi `upsertProfile` và hiện toast xác nhận,
  khác hẳn theme/ngôn ngữ áp dụng ngay không cần xác nhận. Ký hiệu hiệu lực áp dụng cho **mọi nơi hiển thị số
  tiền trong app** (dashboard, danh sách giao dịch, form nhập, báo cáo...) — chỉ account loại `in_kind` là
  ngoại lệ, vẫn hiển thị theo `accounts.unit` riêng.
- **Preferences** (gộp 1 card, không tách 3 card riêng — đỡ dài trên mobile; đều là tuỳ chọn local, áp dụng
  ngay, không lưu DB):
  - Theme: segmented control 3 nút Sáng/Tối/Hệ thống.
  - Ngôn ngữ: segmented control 2 nút Tiếng Việt/English.
  - Ẩn/hiện số tiền: 2 nút icon (mắt mở/đóng) — **áp dụng cho TẤT CẢ scope cùng lúc** (`setAllAmountVisibility`),
    khác với nút mắt lẻ ở Today Hero (chỉ đổi 1 scope).

## 5.2 Ẩn/hiện số tiền theo scope (privacy)

Port từ `lib/hooks/use-amount-visibility.ts`. 4 scope độc lập: `dashboard`, `transactions`, `accounts`, `reports`
— mỗi màn tự nhớ trạng thái ẩn/hiện riêng (lưu local, **mặc định ẩn** nếu chưa từng bật). Dùng chung 1 component
hiển thị số tiền (`AmountText`) nhận `scope` — khi ẩn thì hiện dấu `••••••` thay vì số thật. Mục đích: dùng nơi
công cộng không lộ số dư khi vô tình có người nhìn màn hình.

## 5.3 Đăng xuất

`clearPinUnlocked()` (xoá cờ đã unlock PIN) → `supabase.auth.signOut()` → điều hướng về Login. Đảm bảo lần đăng
nhập lại tiếp theo (kể cả cùng tài khoản) phải nhập PIN lại từ đầu nếu account đó có `pin_hash`.

## 5.4 Offline & đồng bộ (khác biệt quan trọng so với web PWA)

Web hiện là PWA: có `manifest.ts`, `sw.js` (service worker), trang `/offline` fallback, install prompt — và từ
bản offline-first, còn có cache local (IndexedDB) cho account/category/profile + hàng đợi giao dịch offline. Trên
native mobile, khái niệm "service worker" **không áp dụng trực tiếp** nhưng phần offline-first thì có logic gốc
để port thẳng:

- App native không cần "install prompt" hay web manifest — icon/splash screen định nghĩa theo chuẩn RN/Flutter
  (asset `app.json`/`pubspec.yaml`).
- **Offline-first đã có trên web**, không còn là quyết định bỏ ngỏ — port lại đúng phạm vi này cho mobile:
  - **Vào app được khi offline**: session đọc từ storage local (không revalidate qua mạng mỗi lần mở app —
    web đổi từ `getUser()` sang `getSession()` ở `lib/hooks/use-auth.ts` để tránh app bị "treo" chờ mạng lúc
    khởi động); PIN gate đọc `profile.pin_hash` từ cache thay vì chờ fetch xong mới hiện được màn nhập PIN
    (`lib/hooks/use-profile.ts`).
  - **Cache đọc**: accounts (kèm balance), categories, profile — cache-aside theo kiểu "gọi API trước, lỗi thì
    đọc cache, không có cache thì mới báo lỗi" (web dùng `lib/offline/cache.ts` + `lib/offline/db.ts`, lưu trong
    IndexedDB, key theo `user_id` để không lẫn dữ liệu giữa các tài khoản trên cùng máy). Mobile port bằng local
    DB tương đương (`expo-sqlite`/WatermelonDB cho RN, `drift`/`sqflite` cho Flutter).
  - **Ghi tạm khi offline**: chỉ áp dụng cho **giao dịch thu/chi** (`lib/hooks/use-transactions.ts` —
    `useCreateTransaction`) — offline hoặc lỗi mạng giữa chừng thì lưu vào hàng đợi local
    (`lib/offline/pending-transactions.ts`) thay vì báo lỗi, kèm toast riêng báo "đã lưu offline". Accounts/
    Categories **không** có hàng đợi ghi offline — các nút thêm/sửa/xoá bị chặn (toast báo cần mạng) khi offline,
    chỉ đọc từ cache.
  - **Màn hình Sync**: nút nổi phụ cạnh nút "+" (chỉ hiện khi có giao dịch đang chờ, kèm badge số lượng) mở modal
    liệt kê từng giao dịch offline với checkbox chọn từng khoản + "chọn tất cả/bỏ chọn tất cả", đồng bộ tuần tự
    từng khoản đã chọn lên server, khoản nào lỗi thì giữ lại trong hàng đợi (xem
    `components/transactions/sync-offline-modal.tsx`, `components/layout/sync-fab.tsx`).
  - **Các màn cần API** (Tổng quan, Báo cáo/cơ cấu danh mục, danh sách giao dịch đầy đủ) không cố hiển thị dữ
    liệu cũ — thay bằng thông báo rõ ràng "cần có mạng" (`components/shared/offline-unavailable.tsx`), cộng 1
    dải banner nhỏ dính đầu trang báo đang offline (`components/shared/offline-banner.tsx`).
- Nếu mobile muốn tối giản hơn bản web (không cần hàng đợi/sync UI), vẫn có thể chỉ làm phần "xem cache +
  thông báo rõ ràng khi mất mạng" — nhưng nên giữ nguyên quyết định "chỉ giao dịch thu/chi mới queue, accounts/
  categories chỉ đọc" để nhất quán hành vi với web.

## 5.5 App icon / splash / branding

Web dùng gradient thương hiệu (`brand-gradient`, xem `app/icon.svg`, `public/logo.svg`, `public/icons/`) và màu
chủ đạo `theme_color: #2f6bff`, `background_color: #eef4ff`. Dùng làm cơ sở cho app icon/splash native (xuất các
kích thước cần thiết theo yêu cầu iOS/Android hoặc Flutter).

## 5.6 Checklist release

- [ ] Profile: sửa tên/ngày sinh, đặt/đổi PIN, đổi đơn vị tiền — không cần khởi động lại app
- [ ] Đổi theme/ngôn ngữ/ẩn-hiện số tiền áp dụng ngay (local, không cần nút Lưu); đổi đơn vị tiền/ký hiệu tuỳ
      chỉnh chỉ có hiệu lực sau khi bấm Lưu (nút chỉ hiện khi có thay đổi chưa lưu) — cả hai đều không cần khởi
      động lại app
- [ ] Lưu đơn vị tiền thành công có toast xác nhận; ký hiệu mới cập nhật ngay ở mọi màn hình đang hiển thị số tiền
- [ ] Đăng xuất xoá sạch trạng thái PIN-unlock, đăng nhập lại (kể cả khác tài khoản) không bị rò trạng thái cũ
- [ ] Ẩn/hiện số tiền hoạt động độc lập theo từng scope, đúng mặc định "ẩn" lần đầu
- [ ] App icon, splash screen, tên app ("Wallio") đúng branding
- [ ] Test trên cả 2 nền tảng iOS/Android (đăng nhập Google, PIN, toàn bộ CRUD)
- [ ] Offline-first: vào app được khi mất mạng, xem được accounts/categories/profile từ cache, ghi được giao
      dịch thu/chi vào hàng đợi local, đồng bộ lại qua màn Sync có chọn từng khoản — đúng phạm vi đã port từ
      web (xem 5.4), không tự mở rộng thêm phạm vi khi chưa thống nhất lại
