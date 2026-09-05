"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles, PieChart, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailLoginForm } from "@/components/auth/email-login-form";
import { EmailSignupForm } from "@/components/auth/email-signup-form";
import { useSupabase } from "@/lib/hooks/use-supabase";
import { useT } from "@/lib/i18n/use-t";
import { ROUTE_PARAMS, ROUTES } from "@/lib/constants/routes";
import { nextDestination } from "@/lib/utils/pwa";

export default function LoginPage() {
  const supabase = useSupabase();
  const { t } = useT();
  const [loading, setLoading] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");

  const HIGHLIGHTS = [
    { icon: Sparkles, text: t("auth.login.highlight1") },
    { icon: Wallet, text: t("auth.login.highlight2") },
    { icon: PieChart, text: t("auth.login.highlight3") },
  ];

  async function handleGoogleLogin() {
    setLoading(true);
    const next = nextDestination();
    const redirectTo = `${window.location.origin}${ROUTES.authCallback}?${ROUTE_PARAMS.next}=${encodeURIComponent(next)}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center p-4 lg:p-8">
      <div className="glass w-full max-w-sm overflow-hidden rounded-xl p-7 text-center lg:grid lg:max-w-4xl lg:grid-cols-2 lg:rounded-[2rem] lg:p-0 lg:text-left">
        {/* Bảng thương hiệu — chỉ hiện ở desktop, thay cho danh sách highlight thu gọn trên mobile. */}
        <div className="brand-gradient relative hidden flex-col justify-between p-10 text-white lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15">
                <Image src="/logo.svg" alt="Wallio" width={30} height={30} />
              </div>
              <span className="text-xl font-extrabold tracking-tight">Wallio</span>
            </div>
            <h2 className="mt-12 text-3xl leading-tight font-extrabold">{t("auth.login.tagline")}</h2>
          </div>

          <ul className="flex flex-col gap-5">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.text} className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-base font-medium">{item.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Cột đăng nhập — luôn hiện, là toàn bộ nội dung trên mobile. */}
        <div className="lg:flex lg:flex-col lg:justify-center lg:p-10">
          <div className="lg:hidden">
            <div className="brand-gradient mx-auto flex size-14 items-center justify-center rounded-xl shadow-glow">
              <Image src="/logo.svg" alt="Wallio" width={38} height={38} priority />
            </div>
            <h1 className="mt-4 text-xl font-extrabold tracking-tight">Wallio</h1>
            <p className="mt-1 text-xs text-muted-foreground">{t("auth.login.tagline")}</p>
          </div>

          <h2 className="hidden text-2xl font-extrabold tracking-tight lg:block">
            {t("auth.login.formTitle")}
          </h2>

          <Button
            className="mt-6 w-full"
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
            {loading ? t("auth.login.redirecting") : t("auth.login.signInGoogle")}
          </Button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold text-muted-foreground">{t("auth.emailLogin.orDivider")}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs value={authTab} onValueChange={(v) => setAuthTab(v as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t("auth.emailLogin.tabLogin")}</TabsTrigger>
              <TabsTrigger value="signup">{t("auth.emailLogin.tabSignup")}</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-4">
              <EmailLoginForm />
            </TabsContent>
            <TabsContent value="signup" className="mt-4">
              <EmailSignupForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
