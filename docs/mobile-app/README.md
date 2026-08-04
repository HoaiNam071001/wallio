# Wallio Mobile — Tài liệu chuyển đổi sang React Native / Flutter

> Bộ tài liệu này mô tả lại **app Wallio hiện có** (Next.js PWA, đã chạy thật — không phải bản spec ban đầu) để làm
> cơ sở xây dựng lại bằng React Native hoặc Flutter. Backend (Supabase: Postgres + Auth + RLS) **giữ nguyên,
> dùng chung** cho cả web lẫn mobile — chỉ viết lại lớp client.

## 1. App hiện tại là gì

**Wallio** — sổ thu chi cá nhân, mobile-first, đã vượt xa spec gốc trong `CLAUDE.md`. Ngoài các tính năng cơ bản
(thu/chi, chuyển khoản, nhiều nguồn tiền, filter, báo cáo, đăng nhập Google), bản hiện tại còn có:

- **Khoá màn hình bằng PIN 6 số** sau khi đã đăng nhập Google (lớp tiện lợi, không phải bảo mật thật sự).
- **Nguồn tiền "hiện vật"** (`in_kind`: vàng, cổ phiếu...) với đơn vị tự khai (chỉ, lượng, cổ phiếu...), và
  **chuyển khoản 2 vế khác đơn vị** (vd rút Momo 5.000.000đ → mua 2 chỉ vàng).
- **Cân đối số dư thực tế**: người dùng nhập số tiền thực có tại một ngày, app tự sinh bút toán chênh lệch thay
  vì sửa lịch sử.
- **Đa ngôn ngữ** vi/en, **theme** sáng/tối/hệ thống, **ẩn/hiện số tiền** theo từng màn hình (privacy khi ở nơi công cộng).
- Hồ sơ người dùng (tên hiển thị, ngày sinh), PWA (cài vào màn hình chính, offline fallback).

Xem chi tiết từng phần trong các file:

| File | Nội dung |
|---|---|
| [DATA_MODEL.md](./DATA_MODEL.md) | Schema Postgres đầy đủ (2 migration đã áp dụng), types, công thức nghiệp vụ |
| [PHASE_1_FOUNDATION.md](./PHASE_1_FOUNDATION.md) | Setup dự án, Supabase client, đăng nhập Google, PIN gate, khung điều hướng, theme, i18n |
| [PHASE_2_ACCOUNTS_CATEGORIES.md](./PHASE_2_ACCOUNTS_CATEGORIES.md) | CRUD nguồn tiền (kể cả hiện vật), CRUD danh mục, cân đối số dư |
| [PHASE_3_TRANSACTIONS.md](./PHASE_3_TRANSACTIONS.md) | Danh sách + filter giao dịch, form thêm/sửa (kể cả transfer 2 đơn vị), quick-add |
| [PHASE_4_DASHBOARD_REPORTS.md](./PHASE_4_DASHBOARD_REPORTS.md) | Dashboard tổng quan, báo cáo, biểu đồ, xuất dữ liệu |
| [PHASE_5_SETTINGS_POLISH.md](./PHASE_5_SETTINGS_POLISH.md) | Hồ sơ, cài đặt PIN/theme/ngôn ngữ, sign-out, offline, checklist release |

Nên build theo đúng thứ tự các phase — mỗi phase phụ thuộc dữ liệu/thành phần của phase trước.

## 2. Tech stack đề xuất cho mobile

Giữ nguyên **backend Supabase** (cùng project, cùng bảng, cùng RLS policy). Phần client thay thế hoàn toàn.

| Layer | React Native | Flutter |
|---|---|---|
| Framework | Expo (Router + dev client) | Flutter (Material 3, hỗ trợ Cupertino nếu cần) |
| Ngôn ngữ | TypeScript | Dart |
| Supabase client | `@supabase/supabase-js` | `supabase_flutter` |
| Auth Google (native) | `expo-auth-session` / `@react-native-google-signin/google-signin` → `supabase.auth.signInWithIdToken()` | `google_sign_in` → `supabase.auth.signInWithIdToken()` |
| State/data fetching | `@tanstack/react-query` (giữ nguyên pattern hiện tại) | `riverpod` hoặc `flutter_riverpod` + `AsyncNotifier` (tương đương React Query) |
| Form + validate | `react-hook-form` + `zod` | `flutter_form_builder` + validator thủ công, hoặc `reactive_forms` |
| Charts | `victory-native` / `react-native-gifted-charts` | `fl_chart` |
| Date | `date-fns` (giữ nguyên) | `intl` + `DateFormat` |
| Lưu trạng thái local (theme/locale/pin-unlock) | `expo-secure-store` (PIN unlock, nhạy cảm hơn sessionStorage) + `AsyncStorage`/MMKV (theme, locale) | `flutter_secure_storage` + `shared_preferences` |
| Icon | `lucide-react-native` (cùng bộ icon Lucide đang dùng, giữ tên icon lưu trong DB không đổi) | `lucide_icons` (Flutter có gói tương đương) hoặc map sang Material Icons nếu thiếu |
| Navigation | Expo Router (file-based, gần giống Next.js App Router hiện tại) | `go_router` |

**Quan trọng — khác biệt Auth trên mobile:** web hiện dùng OAuth redirect
(`supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })` + route `/auth/callback`).
Trên mobile **không dùng redirect này** — dùng Google Sign-In SDK gốc lấy ID token rồi gọi
`supabase.auth.signInWithIdToken({ provider: 'google', token })`. Không cần route callback, không cần deep link
cho bước này (trừ khi thêm magic link sau này).

## 3. Nguyên tắc khi port

- **RLS là ranh giới bảo mật thật sự** — mọi query chỉ cần `.eq`/`.select` bình thường qua Supabase client đã
  đăng nhập, không cần tự thêm `user_id = ...` (trừ view `account_balances`, xem [DATA_MODEL.md](./DATA_MODEL.md)).
- **PIN không phải xác thực thứ hai** — chỉ là khoá màn hình tiện lợi trên một session Supabase đã hợp lệ. Trên
  mobile có thể nâng cấp UX bằng Face ID/Touch ID (`expo-local-authentication` / `local_auth`) làm lớp mở khoá
  nhanh, nhưng PIN vẫn phải giữ làm phương án dự phòng.
- **Đơn vị tiền tệ mặc định là VNĐ**, format kiểu Việt Nam (`1.250.000 ₫`), riêng nguồn tiền `in_kind` hiển thị
  theo đơn vị tự khai (không có dấu `₫`).
- **Mobile-first, ít chạm**: màn "Thêm giao dịch" là trung tâm trải nghiệm, cần tối ưu số lần chạm/gõ.
- Toàn bộ text hiện tại đi qua **dictionary i18n** (`vi`/`en`) — không hardcode chuỗi trong component.
