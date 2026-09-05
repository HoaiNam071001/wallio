# Phase 1 — Nền móng: setup, đăng nhập, khung điều hướng, theme, i18n

Mục tiêu: có một app chạy được, đăng nhập Google thành công, vào được khung điều hướng chính (rỗng), đổi được
theme/ngôn ngữ. Chưa cần dữ liệu thật.

## 1.1 Setup dự án

- Expo (RN) hoặc Flutter, kết nối cùng Supabase project với bản web (đọc `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` hiện có trong `.env.local` của web để lấy URL/anon key — dùng đúng project đó,
  **không tạo project Supabase mới**, vì dữ liệu user thật nằm ở đó).
- Copy nguyên `lib/types/database.types.ts` (đổi cú pháp sang Dart nếu Flutter) làm nguồn types.
- Copy `supabase/migrations/*.sql` vào repo mobile (hoặc symlink) để tham khảo — không chạy lại migration, DB đã tồn tại.

## 1.2 Đăng nhập Google (khác web — đọc kỹ)

Web dùng redirect OAuth (`signInWithOAuth` + route `/auth/callback`). **Mobile không dùng cách này.** Dùng native
Google Sign-In SDK lấy ID token, sau đó:

```ts
// RN (tương tự Flutter với supabase_flutter)
const { idToken } = await GoogleSignin.signIn();
const { data, error } = await supabase.auth.signInWithIdToken({
  provider: "google",
  token: idToken,
});
```

- RN: `@react-native-google-signin/google-signin` (cần config `iosClientId`/`webClientId` trong Google Cloud Console
  — dùng đúng OAuth Client đã tạo cho Supabase, tạo thêm client type "iOS"/"Android" nếu chưa có).
- Flutter: package `google_sign_in` + `supabase_flutter`, flow tương tự.
- Không cần deep link/route callback cho bước này.
- Sau khi có session, **middleware bảo vệ route** của web (`lib/supabase/middleware.ts`, redirect `/login` nếu
  chưa đăng nhập) tương đương với: kiểm tra `supabase.auth.getSession()` lúc app khởi động, điều hướng tới màn
  Login nếu null, lắng nghe `onAuthStateChange` để tự chuyển màn khi session đổi (login/logout).
- **Trang chủ marketing (chỉ web, không áp dụng cho mobile)**: web hiện có route `/` (`app/page.tsx`) là một
  landing page công khai (không cần đăng nhập) giới thiệu app, hiện ra trước khi user vào `/login`. Route này tự
  redirect thẳng vào app (bỏ qua landing page) nếu phát hiện đang chạy dưới dạng PWA đã cài (`display-mode:
  standalone` hoặc `navigator.standalone`) — tức là hành vi y hệt bản cũ (vào thẳng Login/app) khi mở từ icon đã
  cài trên máy. Vì app native (RN/Flutter) *luôn* ở trạng thái "đã cài" tương đương, mobile **không cần port landing
  page này** — cứ giữ nguyên logic route guard ở trên: kiểm tra session xong vào thẳng Login hoặc màn chính.
  Đã đăng nhập trên web có nút "Về trang chủ" (`layout.backToHome`, ở menu Topbar và màn Profile) để quay lại xem
  landing page — không có tương đương cần thiết trên mobile.
- **⚠️ Đích đến sau khi đăng nhập (web) phụ thuộc standalone hay không**: `app/(auth)/login/page.tsx` tự kiểm
  tra `display-mode: standalone` / `navigator.standalone` ngay trước khi gọi `signInWithOAuth`, rồi gắn kết quả
  vào query `next` của `redirectTo` (`/auth/callback?next=...`) — standalone (PWA đã cài) → vào thẳng
  `/transactions` như cũ; trình duyệt thường → về `/` (trang chủ) để user tự bấm "Vào app". Route
  `/auth/callback` đọc `next` đó, mặc định về `/` nếu thiếu. Vì mobile native luôn coi như "đã cài", flow tương
  đương là vào thẳng màn chính sau khi có session — không cần khái niệm `next` này.

## 1.2b Đăng nhập Email + Mật khẩu (mới — giống nhau trên web/mobile)

Ngoài Google OAuth ở §1.2, web đã thêm đăng nhập/đăng ký bằng email + mật khẩu
(`components/auth/email-login-form.tsx`, `email-signup-form.tsx`, gắn dạng tab trên
`app/(auth)/login/page.tsx`). **Khác với Google OAuth, luồng này không cần phân biệt web/mobile** — không có
redirect/deep-link nào cả, chỉ gọi thẳng 3 method của `supabase-js` (mobile dùng `supabase_flutter` hoặc
`@supabase/supabase-js` cho RN, cùng API):

```ts
await supabase.auth.signInWithPassword({ email, password });
await supabase.auth.signUp({ email, password, options: { emailRedirectTo } }); // emailRedirectTo chỉ có ý nghĩa trên web
await supabase.auth.updateUser({ password }); // đặt/đổi mật khẩu cho user đã đăng nhập
```

- `signUp` với **"Confirm email" đang bật** (mặc định) không trả về session ngay — phải hiện trạng thái "kiểm
  tra email" chờ xác nhận. Nếu email đã có tài khoản, Supabase **không báo lỗi thẳng** mà trả về "thành công" với
  `data.user.identities` là mảng rỗng (chống dò email tồn tại) — phải tự suy ra ca này từ `identities.length ===
  0` để hiện thông báo phù hợp, không thể chỉ bắt `error`.
- **Nhắc đặt mật khẩu cho tài khoản chỉ có Google**: `user.identities` (mảng identity đã liên kết, có sẵn trên
  object `User` của SDK) chứa `{ provider: "google" }` nhưng chưa có `{ provider: "email" }` cho tới khi user
  gọi `updateUser({ password })` — helper `hasPasswordIdentity`/`isGoogleOnlyAccount`
  (`lib/utils/identities.ts`) kiểm tra đúng điều kiện này, port nguyên trạng sang mobile vì chỉ đọc field có sẵn
  trên `User`, không có phần nào riêng cho web. Web hiện một modal nhắc theo đúng khuôn `PinReminderModal` ở
  §1.3 (`components/auth/password-reminder-modal.tsx`, dismiss theo ngày qua storage) — mobile nên dựng một màn
  hình/modal tương đương, và một mục "Đặt mật khẩu đăng nhập" trong màn Hồ sơ (khác PIN 6 số ở §1.3 — mật khẩu
  này dùng để đăng nhập lại bằng email khi không đăng nhập được Google, không phải khoá màn hình).
- Đổi/đặt mật khẩu qua `updateUser` **không yêu cầu nhập lại mật khẩu cũ** (chỉ cần session còn hiệu lực) — cùng
  mức rủi ro với đổi PIN, chấp nhận được cho app cá nhân một người dùng.
- Chưa có luồng "quên mật khẩu đăng nhập" (`resetPasswordForEmail`) — ngoài phạm vi lúc thêm tính năng này, nếu
  làm thêm thì port giống các method trên (không cần khác gì giữa web/mobile).
- Không cần setting gì thêm trong Postgres/RLS — mật khẩu do Supabase Auth (GoTrue) quản lý trong `auth.users`,
  ngoài phạm vi các bảng ứng dụng.

## 1.3 PIN Gate (khoá màn hình)

Đây là lớp UX, **không phải auth thật** — RLS mới là ranh giới bảo mật (xem [DATA_MODEL.md](./DATA_MODEL.md#6-rls--áp-dụng-như-nhau-cho-mọi-clientwebmobile)).
Logic (port từ `components/auth/pin-gate.tsx` + `lib/utils/pin.ts`):

1. Sau khi có `user` (đã đăng nhập) và load xong `profile`, nếu `profile.pin_hash` tồn tại **và** trạng thái unlock
   đã hết hạn → hiện màn nhập PIN 6 ô, che toàn bộ app.
2. Hash PIN nhập vào: `SHA-256(salt=user.id + ":" + pin)`, so với `profile.pin_hash`. Đúng → lưu cờ "đã unlock".
3. **Trạng thái unlock = mốc thời gian hoạt động gần nhất, trượt theo thời gian nhàn rỗi** (`PIN_IDLE_TIMEOUT_MS`,
   hiện là **2 phút**), lưu ở storage bền (web: `localStorage`; mobile: secure storage):
   - Khi app đang hiển thị, mốc được gia hạn mỗi 30s; khi app xuống nền (`visibilitychange`/`pagehide`) thì
     chốt mốc ngay tại thời điểm rời đi, vì timer bị đóng băng ở nền.
   - Khi quay lại app: rời dưới 2 phút → vào thẳng, không hỏi PIN; quá 2 phút → khoá lại.
   - **Không** dùng `sessionStorage`: PWA/webview mobile bị hệ điều hành thu hồi khi chuyển sang app khác,
     lúc quay lại app khởi động như phiên mới nên cờ sessionStorage mất sạch và bắt nhập PIN oan.
   - Mốc ở tương lai (đồng hồ máy bị chỉnh lùi) được coi là hết hạn.
4. "Quên mật khẩu": đánh dấu cờ `pin-reset-requested` (dùng storage bền hơn — trên mobile, secure storage, không
   phải bộ nhớ tạm), sign-out, bắt đăng nhập lại Google. Đăng nhập lại thành công tự chứng minh danh tính →
   cho đặt PIN mới ngay, không cần nhập PIN cũ.
5. **Cân nhắc nâng cấp cho mobile**: thêm Face ID/Touch ID/vân tay (`expo-local-authentication` / `local_auth`)
   làm lối tắt mở khoá nhanh hơn, PIN vẫn là phương án dự phòng bắt buộc phải giữ.

## 1.4 Khung điều hướng

Web có 2 layout song song theo kích thước màn hình — mobile app chỉ cần layout dạng mobile (bottom tabs), không
cần sidebar:

**Bottom tab bar (3 mục — `MOBILE_NAV_ITEMS`):**

| Tab | Route web tương ứng | Icon |
|---|---|---|
| Sổ (Transactions) | `/transactions` | NotebookPen |
| Tổng quan (Dashboard) | `/dashboard` | LayoutGrid |
| Tôi (Profile) | `/profile` | UserRound |

- **Accounts** và **Categories** *không* có tab riêng trên mobile — truy cập qua 2 widget card trong tab
  "Tổng quan" của màn Profile (xem PHASE_2 và PHASE_5).
- **Nút "+" nổi (FAB)** cố định góc dưới-phải trên mọi màn (trừ chính màn "Thêm giao dịch"), dẫn tới màn Thêm
  giao dịch — đây là lối vào ghi giao dịch nhanh nhất, ưu tiên UX hàng đầu.
- Route `/dashboard` trên web thực chất là 2 tab con gộp lại: "Tổng quan" (`OverviewTab`) và "Báo cáo"
  (`ReportsTab`) — xem PHASE_4.

## 1.5 Theme (sáng/tối/hệ thống)

Port từ `lib/hooks/use-theme.ts`: 3 lựa chọn `light | dark | system`, lưu lựa chọn (không lưu giá trị đã resolve)
vào local storage, mặc định `system`. Khi `system`, theo dõi thay đổi theme hệ điều hành runtime (RN:
`Appearance.addChangeListener`; Flutter: `MediaQuery.platformBrightnessOf` + rebuild).

Bảng màu thương hiệu (từ `lib/theme/palette.ts`) — port nguyên bảng màu này:

```
COLOR_SWATCHES (14 màu chọn cho account/category): #3b82f6, #0ea5e9, #06b6d4, #10b981, #22c55e, #84cc16,
  #f59e0b, #f97316, #ef4444, #ec4899, #a855f7, #6366f1, #b45309, #64748b
CHART_PALETTE (10 màu vẽ biểu đồ khi item chưa có màu riêng): #3b82f6, #f97316, #10b981, #a855f7, #ec4899,
  #06b6d4, #f59e0b, #6366f1, #22c55e, #ef4444
```

Màu ngữ nghĩa: **xanh lá = income**, **đỏ = expense**, **xanh dương/tím = transfer**. Màu fallback cho item chưa
gán màu riêng dùng hash ổn định theo `id` (không theo thứ hạng/index) — để lọc bớt item không đổi màu các item còn lại
(hàm `colorForKey`).

## 1.6 i18n (vi/en)

Web dùng **react-i18next** (không phải dictionary tự chế nữa). Resource JSON tại `lib/i18n/resources/vi.json` và
`en.json` (~cùng cấu trúc namespace theo màn hình như trước: `auth`, `nav`, `dashboard`, `transactions`, `accounts`,
`categories`, `reports`, `profile`, `accountType`, `dateRangePreset`, `common`...), key nested truy cập qua
`t("namespace.sub.key")`, biến nội suy qua cú pháp `{{var}}` (vd `t("accounts.card.activityDaysAgo", { days })`),
mảng (vd `calendar.weekdays`) đọc qua `t(key, { returnObjects: true }) as string[]`.

Hai cách dùng trong component (`"use client"`):
- **`<I18n k="a.b.c" vars={{...}} />`** (`lib/i18n/I18n.tsx`) — component render thẳng chuỗi đã dịch, dùng cho phần
  lớn text JSX thuần, không cần gọi hook riêng ở nơi gọi.
  Ưu tiên dùng.
- **`useT()`** (`lib/i18n/use-t.ts`) — hook trả `{ t, locale, setLocale }`, dùng khi cần `t` dạng hàm gọi được:
  thuộc tính (`aria-label`, `placeholder`), toast, mảng build từ nhiều key, hoặc truyền `t: TFunction` (từ package
  `i18next`) vào một hàm helper thuần ngoài component.

Khởi tạo i18next tại `lib/i18n/index.ts`: `lng` luôn hardcode `"vi"` lúc init (khớp `<html lang="vi">` render từ
server) — locale thật lưu trong localStorage được áp lại sau mount bởi `I18nBootstrap`
(`components/shared/i18n-bootstrap.tsx`, mount trong `app/providers.tsx` cùng `I18nextProvider`), để tránh
hydration mismatch. Đổi `i18n.changeLanguage()` tự ghi lại localStorage key `wallio:locale` (không đổi so với
trước) qua listener `languageChanged`. Mặc định `vi`, chọn lưu local, không theo ngôn ngữ hệ thống tự động — hành
vi y hệt bản cũ. `app/layout.tsx` vẫn giữ script bootstrap set `document.documentElement.lang` trước khi
hydrate để tránh nháy ngôn ngữ. Toàn bộ text UI đi qua i18next — không hardcode chuỗi.

## 1.7 Icon & màu cho account/category

Toàn bộ icon lưu trong DB là **tên chuỗi** tham chiếu bộ Lucide (vd `"Wallet"`, `"Utensils"`) — port nguyên danh
sách `ICON_REGISTRY` trong `lib/theme/icons.ts` (~60 icon) để không phá dữ liệu cũ khi hiển thị icon đã chọn từ
web. RN dùng `lucide-react-native` (cùng tên icon). Flutter không có Lucide 1:1 — cần map tên icon sang
`lucide_icons` package (có hỗ trợ phần lớn) hoặc Material Icons tương đương, giữ **tên lưu trong DB không đổi**.

## 1.8 Checklist cuối phase 1

- [ ] Đăng nhập/đăng xuất Google hoạt động, session tự khôi phục khi mở lại app
- [ ] PIN gate: đặt PIN lần đầu (ở phase 5 mới có UI đặt PIN đầy đủ — tạm có thể test bằng cách set `pin_hash` trực tiếp trong DB), nhập đúng/sai, quên PIN → đăng nhập lại
- [ ] PIN gate + background: chuyển sang app khác rồi quay lại **dưới 2 phút** → không hỏi PIN (kể cả khi OS đã kill webview/app); rời **quá 2 phút** → hỏi lại PIN
- [ ] Bottom tab bar 3 mục + FAB nổi
- [ ] Đổi theme sáng/tối/hệ thống, đổi ngôn ngữ vi/en — áp dụng ngay không cần khởi động lại
- [ ] Route guard: chưa đăng nhập → về màn Login; đã đăng nhập mà vào Login → tự chuyển vào app
