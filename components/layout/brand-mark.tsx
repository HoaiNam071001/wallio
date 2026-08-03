import Image from "next/image";
import { cn } from "@/lib/utils";

/** Logo Wallio — dùng chung cho sidebar, topbar và màn hình đăng nhập. */
export function BrandMark({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-2xl bg-white shadow-soft ring-1 ring-brand-200/70",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.svg"
        alt="Wallio"
        width={size}
        height={size}
        priority
        style={{ width: size * 0.78, height: size * 0.78 }}
      />
    </span>
  );
}
