import { ElementBuilder, SkeletonTemplate } from "skeleton-styler";

/**
 * Hình dạng skeleton dựng bằng chính DSL của `skeleton-styler`. Mỗi hàm export trả về 1
 * `ElementBuilder` tự chứa toàn bộ danh sách (dùng `setCount(n)` để nhân bản item — không lặp ở
 * phía React), gọi 1 lần và giữ qua `useMemo`, render bằng `<SkeletonView instance={...} />`
 * (xem `components/ui/skeleton.tsx`).
 */

/** Khớp `AccountCard`: avatar + nút kebab ở đầu, rồi tên / loại / số dư / hoạt động gần nhất. */
function accountCardShape() {
  return new ElementBuilder()
    .setClass("glass")
    .s_p(16)
    .s_rounded(24)
    .s_flexColumn()
    .s_gap(10)
    .append(
      new ElementBuilder()
        .s_flex()
        .s_justifyBetween()
        .s_itemsCenter()
        .append(
          SkeletonTemplate.Avatar({ size: 48 }),
          new ElementBuilder().s_w(32).s_h(32).s_rounded(999).markAsSkeleton(),
        ),
      SkeletonTemplate.Line({ w: "66%", h: 16 }),
      SkeletonTemplate.Line({ w: "33%", h: 12 }),
      SkeletonTemplate.Line({ w: "50%", h: 22 }),
      SkeletonTemplate.Line({ w: "40%", h: 12 }),
    );
}

/** Lưới card tài khoản đang tải — khớp `grid gap-3 sm:grid-cols-2 lg:grid-cols-3` ở accounts/page.tsx. */
export function accountCardsSkeleton(count = 4) {
  return new ElementBuilder()
    .setClass("grid gap-3 sm:grid-cols-2 lg:grid-cols-3")
    .append(accountCardShape().setCount(count));
}

function categoryChipShape() {
  return new ElementBuilder()
    .setClass("glass")
    .s_flex()
    .s_itemsCenter()
    .s_gap(12)
    .s_p(12)
    .s_rounded(24)
    .append(SkeletonTemplate.Avatar({ size: 44 }), SkeletonTemplate.Line({ w: "60%", h: 16 }));
}

/** Lưới danh mục đang tải — khớp `grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3` ở categories/page.tsx. */
export function categoryChipsSkeleton(count = 6) {
  return new ElementBuilder()
    .setClass("grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3")
    .append(categoryChipShape().setCount(count));
}

function transactionRowShape() {
  return new ElementBuilder()
    .s_flex()
    .s_itemsCenter()
    .s_gap(10)
    .s_px(12)
    .s_py(8)
    .append(
      new ElementBuilder().s_w(36).s_h(36).s_rounded(12).markAsSkeleton(),
      new ElementBuilder()
        .s_flex1()
        .s_flexColumn()
        .s_gap(6)
        .append(SkeletonTemplate.Line({ w: "50%", h: 14 }), SkeletonTemplate.Line({ w: "33%", h: 12 })),
      SkeletonTemplate.Line({ w: 64, h: 14 }),
    );
}

/** Danh sách hàng giao dịch đang tải — dùng ở sổ thu chi và mục gần đây của Tổng quan. */
export function transactionRowsSkeleton(count = 5) {
  return new ElementBuilder().setClass("flex flex-col gap-1").append(transactionRowShape().setCount(count));
}
