import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wallio — Sổ thu chi cá nhân",
    short_name: "Wallio",
    description: "Ghi chép thu chi hằng ngày, quản lý nguồn tiền và xem báo cáo trong vài chạm.",
    id: "/",
    start_url: "/transactions",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#eef4ff",
    theme_color: "#2f6bff",
    lang: "vi",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Thêm giao dịch", short_name: "Thêm", url: "/transactions/new" },
      { name: "Tổng quan", short_name: "Tổng quan", url: "/dashboard" },
    ],
  };
}
