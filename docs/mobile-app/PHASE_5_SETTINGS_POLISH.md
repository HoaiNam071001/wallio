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
- **Preferences** (gộp 1 card, không tách 3 card riêng — đỡ dài trên mobile):
  - Theme: segmented control 3 nút Sáng/Tối/Hệ thống.
  - Ngôn ngữ: segmented control 2 nút Tiếng Việt/English.
  - **Đơn vị tiền**: dropdown chọn từ danh sách dựng sẵn (`lib/constants/currencies.ts`, ~18 đơn vị hay dùng —
    VND, USD, EUR, JPY, GBP...), mỗi lựa chọn hiện tên (theo ngôn ngữ đang chọn, khoá i18n `currency.<code>.name`)
    + ký hiệu mặc định. Chọn xong lưu ngay vào `profiles.currency_code` (không cần nút Lưu riêng). Bên dưới có ô
    **ký hiệu tuỳ chỉnh** (`profiles.currency_symbol`) để ghi đè ký hiệu mặc định — để trống thì dùng lại ký hiệu
    mặc định của đơn vị đang chọn (VND để trống thì ký hiệu vẫn là "₫" như cũ, không đổi hành vi mặc định). Ký
    hiệu hiệu lực áp dụng cho **mọi nơi hiển thị số tiền trong app** (dashboard, danh sách giao dịch, form nhập,
    báo cáo...) — chỉ account loại `in_kind` là ngoại lệ, vẫn hiển thị theo `accounts.unit` riêng.
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

Web hiện là PWA: có `manifest.ts`, `sw.js` (service worker), trang `/offline` fallback, install prompt. Trên
native mobile, các khái niệm này **không áp dụng trực tiếp** — cần thiết kế lại:

- App native không cần "install prompt" hay web manifest — icon/splash screen định nghĩa theo chuẩn RN/Flutter
  (asset `app.json`/`pubspec.yaml`).
- **Offline-first thật sự** (khác PWA chỉ có 1 trang fallback tĩnh) là cải tiến tự nhiên nên cân nhắc cho mobile:
  cache danh sách account/category/transaction gần nhất bằng local DB (RN: `expo-sqlite`/WatermelonDB; Flutter:
  `drift`/`sqflite`), cho phép xem (và có thể ghi tạm — queue để sync khi có mạng) khi mất kết nối. Đây là quyết
  định phạm vi (scope) cần **thống nhất với người yêu cầu** trước khi làm — không nằm trong app web hiện tại nên
  không có logic gốc để port, phải thiết kế mới.
- Nếu chỉ muốn tương đương "offline fallback" đơn giản như web (không phải offline-first), chỉ cần: hiện thông
  báo/màn hình rõ ràng khi mất mạng, không crash khi query lỗi vì network.

## 5.5 App icon / splash / branding

Web dùng gradient thương hiệu (`brand-gradient`, xem `app/icon.svg`, `public/logo.svg`, `public/icons/`) và màu
chủ đạo `theme_color: #2f6bff`, `background_color: #eef4ff`. Dùng làm cơ sở cho app icon/splash native (xuất các
kích thước cần thiết theo yêu cầu iOS/Android hoặc Flutter).

## 5.6 Checklist release

- [ ] Profile: sửa tên/ngày sinh, đặt/đổi PIN, đổi theme/ngôn ngữ/đơn vị tiền/ẩn-hiện số tiền — tất cả áp dụng ngay, không cần khởi động lại app
- [ ] Đổi đơn vị tiền (hoặc ký hiệu tuỳ chỉnh) cập nhật ngay lập tức ở mọi màn hình đang hiển thị số tiền
- [ ] Đăng xuất xoá sạch trạng thái PIN-unlock, đăng nhập lại (kể cả khác tài khoản) không bị rò trạng thái cũ
- [ ] Ẩn/hiện số tiền hoạt động độc lập theo từng scope, đúng mặc định "ẩn" lần đầu
- [ ] App icon, splash screen, tên app ("Wallio") đúng branding
- [ ] Test trên cả 2 nền tảng iOS/Android (đăng nhập Google, PIN, toàn bộ CRUD)
- [ ] Quyết định rõ phạm vi offline trước khi launch — không để mơ hồ giữa "chỉ web PWA có" và "cần offline-first thật"
