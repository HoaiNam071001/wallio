"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { ThemeEffect } from "@/components/shared/theme-effect";
import { I18nBootstrap } from "@/components/shared/i18n-bootstrap";
import { CurrencyEffect } from "@/components/shared/currency-effect";
import i18n from "@/lib/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeEffect />
        <I18nBootstrap />
        <CurrencyEffect />
        {children}
      </I18nextProvider>
    </QueryClientProvider>
  );
}
