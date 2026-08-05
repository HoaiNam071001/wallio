"use client";

import { useEffect, useRef } from "react";
import { ElementBuilder, SkeletonAnimation } from "skeleton-styler";

let configured = false;

/**
 * Set 1 lần cho cả app — màu lấy từ biến CSS `--skeleton-base`/`--skeleton-highlight`
 * (xem globals.css) nên tự đổi theo light/dark qua class `.dark` trên `<html>`.
 */
function ensureSkeletonTheme() {
  if (configured) return;
  configured = true;
  ElementBuilder.setConfigs({
    animation: SkeletonAnimation.Pulse,
    colors: ["var(--skeleton-base)", "var(--skeleton-highlight)"],
  });
}

/**
 * Wrapper React theo đúng pattern chính thức của `skeleton-styler` (README mục "2. ReactJS"):
 * `instance` là 1 cây `ElementBuilder` dựng sẵn (xem `lib/skeleton/shapes.ts`, nên dựng qua
 * `useMemo` để giữ nguyên tham chiếu) — loading thì generate() gắn vào DOM, hết loading thì bỏ
 * đi và render `children` thật.
 */
export function SkeletonView({
  loading,
  instance,
  className,
  children,
}: {
  loading: boolean;
  instance: ElementBuilder;
  className?: string;
  children?: React.ReactNode;
}) {
  ensureSkeletonTheme();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!loading || !el) return;
    el.replaceChildren(instance.generate());
    return () => {
      el.replaceChildren();
    };
  }, [loading, instance]);

  if (!loading) return <>{children}</>;
  return <div ref={ref} className={className} />;
}
