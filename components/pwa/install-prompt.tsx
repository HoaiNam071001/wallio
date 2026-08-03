"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useIsHandheld } from "@/lib/hooks/use-is-handheld";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "wallio:install-dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const isHandheld = useIsHandheld();

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    // Chỉ mời cài trên điện thoại/tablet — trên máy tính banner này chỉ gây vướng.
    if (!isHandheld) return;

    function onPrompt(event: Event) {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setDeferred(null));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [isHandheld]);

  if (!deferred) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDeferred(null);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  return (
    <div className="fixed inset-x-3 bottom-24 z-50 flex items-center gap-3 rounded-3xl border border-white/50 bg-linear-to-r from-brand-600 to-brand-400 p-3 text-white shadow-glow md:right-6 md:bottom-6 md:left-auto md:w-96">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/20">
        <Download className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Cài Wallio vào máy</p>
        <p className="text-xs text-white/80">Mở nhanh như app, dùng được cả khi yếu mạng.</p>
      </div>
      <button
        onClick={install}
        className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand-700"
      >
        Cài đặt
      </button>
      <button onClick={dismiss} aria-label="Đóng" className="shrink-0 rounded-full p-1 text-white/70">
        <X className="size-4" />
      </button>
    </div>
  );
}
