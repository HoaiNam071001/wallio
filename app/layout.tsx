import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wallio — Sổ thu chi cá nhân",
  description: "Ghi chép thu chi hằng ngày, quản lý nguồn tiền và xem báo cáo trong vài chạm.",
  applicationName: "Wallio",
  appleWebApp: {
    capable: true,
    title: "Wallio",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef4ff" },
    { media: "(prefers-color-scheme: dark)", color: "#141b33" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

const THEME_LOCALE_BOOTSTRAP_SCRIPT = `
(function () {
  try {
    var theme = localStorage.getItem("wallio:theme");
    var resolved =
      theme === "light" || theme === "dark"
        ? theme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.style.colorScheme = resolved;

    var locale = localStorage.getItem("wallio:locale");
    if (locale === "en" || locale === "vi") document.documentElement.lang = locale;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnam.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_LOCALE_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans" suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster position="top-center" richColors />
          <InstallPrompt />
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  );
}
