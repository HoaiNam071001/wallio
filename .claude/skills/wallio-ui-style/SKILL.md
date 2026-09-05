---
name: wallio-ui-style
description: Bộ quy tắc + tài nguyên copy-paste để dựng UI cho một web project khác (Next.js + Tailwind v4 + shadcn/ui) theo đúng phong cách hình ảnh của Wallio — glassmorphism mềm, gradient thương hiệu OKLCH, bo tròn lớn, icon chip màu riêng theo entity. Dùng khi user muốn "làm web mới theo style Wallio", scaffold theme cho project khác, hoặc restyle một trang có sẵn cho giống Wallio.
---

# Wallio UI Style — quy tắc dùng lại cho project khác

Skill này **không chứa business logic của Wallio** (accounts/transactions/...), chỉ chứa **hệ thống thị giác**: màu, bo góc, shadow, font, glass, gradient, và convention component. Mục tiêu: dán vào một Next.js project khác và ra được cùng "cảm giác" UI.

Toàn bộ folder này (`wallio-ui-style/`) tự chứa đủ để copy nguyên sang `.claude/skills/` của project khác.

## 1. Stack giả định

- Next.js App Router + TypeScript
- Tailwind CSS **v4** (config bằng CSS, không có `tailwind.config.ts`) + `tw-animate-css`
- shadcn/ui, style `new-york`, `baseColor: neutral`, `iconLibrary: lucide`
- `class-variance-authority` (cva) cho variant của component
- `lucide-react` cho icon — không trộn thêm bộ icon khác
- Radix UI primitives (qua shadcn) cho dialog/select/popover/dropdown/tabs...

Nếu project đích dùng Tailwind v3 hoặc không dùng shadcn, vẫn áp dụng được phần token màu/OKLCH và các class `.glass`/`.brand-gradient`, nhưng phải tự viết lại phần `@theme inline` cho phù hợp v3 (`tailwind.config` thay vì `@theme`).

## 2. Setup nhanh cho project mới

```bash
npx create-next-app@latest my-app --typescript --tailwind --app
cd my-app
npm install class-variance-authority clsx tailwind-merge lucide-react tw-animate-css
npx shadcn@latest init   # chọn style "new-york", base color "neutral"
```

Sau đó:
1. Thay toàn bộ nội dung `app/globals.css` bằng [reference/tokens.css](reference/tokens.css) (giữ nguyên phần `@import`, `@theme inline`, `@layer base/components` ở đầu/cuối file — chỉ đổi giá trị `--brand-*` nếu muốn tông màu khác xanh dương).
2. Copy [reference/button.tsx](reference/button.tsx) → `components/ui/button.tsx`, [reference/card.tsx](reference/card.tsx) → `components/ui/card.tsx` (đè lên bản shadcn mặc định).
3. Copy [reference/entity-icon.tsx](reference/entity-icon.tsx) và [reference/palette.ts](reference/palette.ts) nếu project có khái niệm "mục có màu riêng" (category, tag, project, label...).
4. Set up font trong `app/layout.tsx` theo mục 5.

## 3. Design tokens — nguyên tắc màu

Toàn bộ màu định nghĩa bằng **OKLCH**, theo 2 tầng:

- **Brand scale**: `--brand-50` → `--brand-900`, 10 bậc, cùng hue/chroma tăng dần độ đậm. Đổi tông thương hiệu = chỉ đổi hue trong 10 dòng này, mọi thứ khác ăn theo qua `--primary`, `--ring`, `.brand-gradient`.
- **Semantic tokens** (shadcn chuẩn): `--background --foreground --card --popover --primary --secondary --muted --accent --destructive --border --input --ring`, mỗi token có bản `.dark` riêng — **không hard-code hex trong component**, luôn dùng token (`bg-card`, `text-muted-foreground`, `border-border`...).

Ngoài ra Wallio có thêm 3 màu nghiệp vụ `--income` (xanh lá), `--expense` (đỏ cam), `--transfer` (tím) — đây là **pattern tuỳ chọn**: nếu web mới có khái niệm trạng thái tương tự (success/danger/info, hoặc domain riêng), thêm 2-3 semantic token dạng `--<status>` + `--<status>-foreground` theo đúng khuôn này thay vì dùng thẳng `green-500`/`red-500` của Tailwind.

Quy tắc màu theo entity (category/tag/account riêng lẻ): mỗi bản ghi lưu 1 mã hex riêng (`color: "#3b82f6"`), UI **không tô nền đặc bằng màu đó** — luôn pha loãng bằng alpha (12–20%) làm nền, giữ màu gốc cho icon/chữ. Xem `withAlpha()` trong [reference/palette.ts](reference/palette.ts).

## 4. Nguyên tắc thị giác cốt lõi (bắt buộc để "giống Wallio")

1. **Bo góc lớn, nhất quán**: 1 biến `--radius: 1.25rem` duy nhất, mọi radius khác suy ra từ nó (`--radius-sm/md/lg/xl/2xl/3xl`, xem `@theme inline` trong tokens.css). Không dùng `rounded-md`/`rounded-lg` tuỳ tiện — card dùng `rounded-xl`, icon chip dùng `rounded-2xl`, button dùng `rounded-full` (pill).
2. **Glass card**: mọi card/panel dùng class `.glass` (nền bán trong suốt + `backdrop-filter: blur` + border mờ + `shadow-card`) thay vì nền đặc `bg-white`. Định nghĩa trong `@layer components` của tokens.css.
3. **Brand gradient cho điểm nhấn, không phải nền chính**: `.brand-gradient` (gradient 135deg 3 điểm dừng) chỉ dùng cho CTA chính (`Button` variant `default`), nav item đang active, FAB — **không** phủ gradient lên toàn bộ nền trang.
4. **Nền trang có ambient glow**: `body` có 3 `radial-gradient` cố định (`background-attachment: fixed`) màu nhạt lấy từ brand + 2 màu phụ, tạo chiều sâu phía sau các glass card. Xem `@layer base body` trong tokens.css.
5. **Shadow mềm, không dùng shadow mặc định Tailwind**: `--shadow-soft` (nút thường), `--shadow-card` (card/glass), `--shadow-glow` (phần tử có gradient/active) — tất cả là shadow lan toả nhẹ, không có shadow cứng/đen.
6. **Bấm có phản hồi**: mọi phần tử bấm được (`Button`, nav item) có `active:scale-[0.97] transition-all`.
7. **Số liệu dùng `tabular-nums`**, font mono riêng cho số nếu cần căn cột.
8. **Icon**: chỉ `lucide-react`, size chuẩn hoá theo bước 0.5 (`size-4`, `size-4.5`, `size-5`, `size-7`) — không tự ý dùng số pixel lẻ.
9. **Font**: 1 font sans hỗ trợ tốt ngôn ngữ chính của app (Wallio dùng Be Vietnam Pro cho tiếng Việt) + 1 font mono cho số/code (Geist Mono). Khai báo qua `next/font/google`, gắn vào CSS var, tham chiếu trong `--font-sans`/`--font-mono` ở `@theme inline`.

## 5. Setup font (app/layout.tsx)

```tsx
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";

const sans = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin"], // thêm "vietnamese" nếu app tiếng Việt
  weight: ["400", "500", "600", "700", "800"],
});
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// <html className={`${sans.variable} ${mono.variable} antialiased`}>
```
Đổi font khác thì chỉ cần đổi ở đây + 2 dòng `--font-sans`/`--font-mono` trong tokens.css, phần còn lại của hệ thống không đổi.

## 6. Component conventions

- **Button** ([reference/button.tsx](reference/button.tsx)): dựng bằng `cva`, các variant `default` (brand-gradient), `outline`, `secondary`, `ghost`, `destructive`, `link`; size `sm/default/lg/icon`. Bo `rounded-full` toàn bộ, `shadow-glow` cho variant chính.
- **Card** ([reference/card.tsx](reference/card.tsx)): luôn `glass` + `rounded-xl`, padding ngang `px-5`, không viền cứng (border đến từ `.glass`).
- **Layout desktop/mobile**: desktop dùng sidebar cố định bên trái (`hidden md:flex`, nền `bg-white/45 backdrop-blur-xl`, nav item active = `.brand-gradient`); mobile dùng bottom nav cố định (`fixed inset-x-0 bottom-0 md:hidden`, có `pb-safe` cho notch) + có thể thêm FAB nổi (`fixed`, brand-gradient, tròn) cho hành động chính (VD "thêm mới nhanh").
- **PageHeader**: 1 dòng `h1` (`text-2xl font-extrabold tracking-tight`) + subtitle mờ (`text-sm text-muted-foreground`) bên trái, action slot bên phải — dùng lại cho mọi trang thay vì mỗi trang tự viết header.
- **EmptyState**: icon trong chip tròn `bg-brand-500/12 text-brand-600`, tiêu đề đậm, mô tả phụ mờ, action tuỳ chọn — dùng cho mọi danh sách rỗng.
- **EntityIcon** (nếu có domain "mục có màu riêng"): chip `rounded-2xl` nền = màu entity ở alpha 14%, icon/màu chữ = màu gốc entity, `ring-1 ring-inset` cùng màu alpha thấp hơn.
- **Stat/summary card**: card `.glass` + `linear-gradient` phủ nhẹ theo màu riêng của từng chỉ số (alpha ~14% ở góc, trong suốt dần), icon chip nhỏ cùng tông.

## 7. Quy tắc tổ chức code (giữ nhất quán khi mở rộng)

- `components/ui/` — primitive từ shadcn, hạn chế sửa ngoài token/variant.
- `components/<domain>/` — 1 folder theo mỗi domain nghiệp vụ (không gộp chung "components/misc").
- `components/shared/` — component dùng chéo domain (PageHeader, EmptyState, EntityIcon...).
- `components/layout/` — Sidebar, BottomNav, TopBar, FAB.
- `lib/utils.ts` — hàm `cn()` (clsx + tailwind-merge).
- `lib/theme/palette.ts` — bảng màu chọn cho entity + `withAlpha`/`colorForKey` nếu cần màu ổn định theo id.

## 8. Checklist khi scaffold web mới theo style này

- [ ] Cài stack ở mục 2, `shadcn init` với style `new-york`
- [ ] Thay `app/globals.css` bằng tokens.css, chỉnh hue của `--brand-*` cho đúng thương hiệu mới
- [ ] Set up 2 font (sans + mono) theo mục 5
- [ ] Đè `button.tsx`, `card.tsx` từ `reference/`
- [ ] Kiểm tra `body` có ambient gradient + `.glass`/`.brand-gradient` hoạt động (test 1 card + 1 button)
- [ ] Dựng Sidebar (desktop) + BottomNav (mobile) theo convention mục 6
- [ ] Nếu có "mục có màu riêng" (category/tag/status): thêm `palette.ts` + `EntityIcon`
- [ ] Rà lại: không còn `bg-white`/`shadow-md`/`rounded-md` rải rác thay cho token chuẩn

## Reference files

- [reference/tokens.css](reference/tokens.css) — toàn bộ block token OKLCH + `.glass`/`.brand-gradient`/ambient background, copy thẳng vào `globals.css`
- [reference/button.tsx](reference/button.tsx) — Button component mẫu (cva variants)
- [reference/card.tsx](reference/card.tsx) — Card component mẫu (glass)
- [reference/entity-icon.tsx](reference/entity-icon.tsx) — chip icon màu riêng theo entity
- [reference/palette.ts](reference/palette.ts) — helper màu (`withAlpha`, `normalizeColor`, `colorForKey`)
