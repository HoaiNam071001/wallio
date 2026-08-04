"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles, PieChart, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/lib/hooks/use-supabase";
import { useTranslation } from "@/lib/i18n/use-translation";
import { ROUTES } from "@/lib/constants/routes";

export default function LoginPage() {
  const supabase = useSupabase();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const HIGHLIGHTS = [
    { icon: Sparkles, text: t.auth.login.highlight1 },
    { icon: Wallet, text: t.auth.login.highlight2 },
    { icon: PieChart, text: t.auth.login.highlight3 },
  ];

  async function handleGoogleLogin() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${ROUTES.authCallback}` },
    });
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center p-4">
      <div className="glass w-full max-w-sm rounded-3xl p-7 text-center">
        <div className="brand-gradient mx-auto flex size-20 items-center justify-center rounded-3xl shadow-glow">
          <Image src="/logo.svg" alt="Wallio" width={56} height={56} priority />
        </div>

        <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Wallio</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.auth.login.tagline}</p>

        <ul className="mt-6 flex flex-col gap-2.5 text-left">
          {HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.text} className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-500/14 text-brand-600">
                  <Icon className="size-4" />
                </span>
                <span className="text-sm font-medium">{item.text}</span>
              </li>
            );
          })}
        </ul>

        <Button
          className="mt-7 w-full"
          size="lg"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" className="size-4">
            <path
              fill="currentColor"
              d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.344-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
            />
          </svg>
          {loading ? t.auth.login.redirecting : t.auth.login.signInGoogle}
        </Button>
      </div>
    </div>
  );
}
