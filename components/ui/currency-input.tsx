"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { formatAmount, parseAmount } from "@/lib/utils/currency";

type CurrencyInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "type" | "inputMode"
> & {
  value?: number | null;
  onValueChange: (value: number | undefined) => void;
  allowNegative?: boolean;
  suffix?: string;
};

function toText(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : formatAmount(value);
}

/**
 * Ô nhập tiền: hiển thị có dấu phân cách hàng nghìn (1.250.000) nhưng
 * trả về number thuần cho form.
 */
export function CurrencyInput({
  value,
  onValueChange,
  allowNegative = false,
  suffix = "đ",
  className,
  onBlur,
  ...props
}: CurrencyInputProps) {
  const [text, setText] = React.useState(() => toText(value));

  // Đồng bộ khi giá trị bị đổi từ bên ngoài (reset form, nạp dữ liệu để sửa...).
  // Điều chỉnh ngay trong lúc render — không dùng effect để tránh render thừa.
  const [lastValue, setLastValue] = React.useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    if (parseAmount(text) !== (value ?? undefined)) setText(toText(value));
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value;
    const negative = allowNegative && raw.trim().startsWith("-");
    const digits = raw.replace(/\D/g, "");

    if (!digits) {
      setText(negative ? "-" : "");
      onValueChange(undefined);
      return;
    }

    const numeric = Number(digits) * (negative ? -1 : 1);
    setText(formatAmount(numeric));
    onValueChange(numeric);
  }

  return (
    <div className="relative">
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={text}
        onChange={handleChange}
        onBlur={(event) => {
          const parsed = parseAmount(text);
          setText(parsed === undefined ? "" : formatAmount(parsed));
          onBlur?.(event);
        }}
        className={cn("pr-9 font-semibold tabular-nums", className)}
      />
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-muted-foreground">
        {suffix}
      </span>
    </div>
  );
}
