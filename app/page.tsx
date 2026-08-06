import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { BarChart3, LayoutDashboard, Receipt, Wallet, WifiOff, Zap } from "lucide-react";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { I18n } from "@/lib/i18n/I18n";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants/routes";

/**
 * Nếu app đã được cài lên máy (PWA standalone / iOS "Add to Home Screen"), giữ nguyên hành vi cũ:
 * vào thẳng app (login hoặc trang chủ trong app) thay vì thấy trang giới thiệu này. Việc này chỉ
 * xác định được ở client (display-mode), nên chạy bằng script inline để redirect trước khi kịp vẽ
 * trang, tránh nháy landing page rồi mới chuyển hướng.
 */
function standaloneRedirectScript(isAuthenticated: boolean) {
  const target = isAuthenticated ? ROUTES.transactions : ROUTES.login;
  return `(function(){
    try {
      var nav = window.navigator;
      var isStandalone = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
      if (isStandalone) window.location.replace(${JSON.stringify(target)});
    } catch (e) {}
  })();`;
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  return (
    <div className="flex flex-1 flex-col">
      <script
        dangerouslySetInnerHTML={{ __html: standaloneRedirectScript(isAuthenticated) }}
      />

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-5 md:px-6">
        <div className="flex items-center gap-2.5">
          <BrandMark size={36} />
          <span className="text-lg font-extrabold tracking-tight">Wallio</span>
        </div>
        <Button asChild size="sm">
          <Link href={isAuthenticated ? ROUTES.transactions : ROUTES.login}>
            <I18n k={isAuthenticated ? "home.nav.openApp" : "home.nav.login"} />
          </Link>
        </Button>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 pt-8 pb-16 text-center md:px-6 md:pt-14">
          <span className="rounded-full bg-brand-500/12 px-3.5 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-300">
            <I18n k="home.hero.badge" />
          </span>
          <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight text-balance md:text-5xl">
            <I18n k="home.hero.title" />
          </h1>
          <p className="max-w-lg text-base text-muted-foreground md:text-lg">
            <I18n k="home.hero.subtitle" />
          </p>
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={isAuthenticated ? ROUTES.transactions : ROUTES.login}>
                <I18n k={isAuthenticated ? "home.hero.ctaOpenApp" : "home.hero.ctaLogin"} />
              </Link>
            </Button>
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            <I18n k="home.hero.freeHint" />
          </p>
        </section>

        {/* Screenshots */}
        <section className="mx-auto w-full max-w-5xl px-4 pb-16 md:px-6">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight">
              <I18n k="home.screenshots.title" />
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              <I18n k="home.screenshots.subtitle" />
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {/* TODO: thay các ô placeholder này bằng ảnh chụp màn hình thật (vd <Image src="/screenshots/transactions.png" .../>) khi có source. */}
            <ScreenshotPlaceholder icon={Receipt} labelKey="home.screenshots.transactions" />
            <ScreenshotPlaceholder icon={LayoutDashboard} labelKey="home.screenshots.dashboard" />
            <ScreenshotPlaceholder icon={BarChart3} labelKey="home.screenshots.reports" />
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-5xl px-4 pb-16 md:px-6">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight">
              <I18n k="home.features.title" />
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              <I18n k="home.features.subtitle" />
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard icon={Zap} titleKey="home.features.quick.title" descriptionKey="home.features.quick.description" />
            <FeatureCard icon={Wallet} titleKey="home.features.accounts.title" descriptionKey="home.features.accounts.description" />
            <FeatureCard icon={BarChart3} titleKey="home.features.reports.title" descriptionKey="home.features.reports.description" />
            <FeatureCard icon={WifiOff} titleKey="home.features.offline.title" descriptionKey="home.features.offline.description" />
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-3xl px-4 pb-20 md:px-6">
          <div className="brand-gradient flex flex-col items-center gap-4 rounded-3xl p-8 text-center text-white shadow-glow md:p-12">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
              <I18n k="home.cta.title" />
            </h2>
            <p className="text-sm text-white/85 md:text-base">
              <I18n k="home.cta.subtitle" />
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-2">
              <Link href={isAuthenticated ? ROUTES.transactions : ROUTES.login}>
                <I18n k={isAuthenticated ? "home.nav.openApp" : "home.cta.button"} />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/40 px-4 py-6 text-center text-xs text-muted-foreground dark:border-white/10">
        <p>
          Wallio — <I18n k="home.footer.tagline" />
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  titleKey,
  descriptionKey,
}: {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
}) {
  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-5">
      <span className="brand-gradient flex size-10 items-center justify-center rounded-xl shadow-soft">
        <Icon className="size-5 text-white" />
      </span>
      <h3 className="text-sm font-bold">
        <I18n k={titleKey} />
      </h3>
      <p className="text-sm text-muted-foreground">
        <I18n k={descriptionKey} />
      </p>
    </div>
  );
}

function ScreenshotPlaceholder({ icon: Icon, labelKey }: { icon: LucideIcon; labelKey: string }) {
  return (
    <div className="flex aspect-9/16 w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-brand-300/60 bg-brand-500/5 p-6 text-center dark:border-brand-500/25 dark:bg-brand-500/10">
      <span className="brand-gradient flex size-12 items-center justify-center rounded-2xl shadow-glow">
        <Icon className="size-6 text-white" />
      </span>
      <p className="text-sm font-bold">
        <I18n k={labelKey} />
      </p>
      <p className="text-xs text-muted-foreground">
        <I18n k="home.screenshots.comingSoon" />
      </p>
    </div>
  );
}
