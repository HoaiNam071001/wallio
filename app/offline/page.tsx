import Image from "next/image";

export const metadata = { title: "Ngoại tuyến — Wallio" };

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <Image src="/logo.svg" alt="Wallio" width={72} height={72} className="opacity-80" />
      <h1 className="text-xl font-bold">Đang ngoại tuyến</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        Có vẻ bạn đang mất kết nối. Kiểm tra mạng rồi thử lại nhé — dữ liệu đã lưu vẫn còn nguyên.
      </p>
    </div>
  );
}
