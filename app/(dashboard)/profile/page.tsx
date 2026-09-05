"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronRight,
  Coins,
  Eye,
  EyeOff,
  Home,
  KeyRound,
  Lock,
  LogOut,
  SlidersHorizontal,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateField } from "@/components/ui/date-field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { EntityIcon } from "@/components/shared/entity-icon";
import { AmountTextForAccount } from "@/components/shared/amount-text";
import { ACCOUNT_TYPE_META } from "@/components/accounts/account-type";
import { useAccountsWithBalance } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { useAuth } from "@/lib/hooks/use-auth";
import { useSupabase } from "@/lib/hooks/use-supabase";
import { useProfile, useUpsertProfile } from "@/lib/hooks/use-profile";
import { setAllAmountVisibility } from "@/lib/hooks/use-amount-visibility";
import { useTheme, type Theme } from "@/lib/hooks/use-theme";
import { useT } from "@/lib/i18n/use-t";
import type { Locale } from "@/lib/i18n";
import { clearPinUnlocked, hashPin, isValidPin } from "@/lib/utils/pin";
import { normalizeColor } from "@/lib/theme/palette";
import { hasPasswordIdentity } from "@/lib/utils/identities";
import { cn, toQueryDate } from "@/lib/utils";
import { ROUTES } from "@/lib/constants/routes";
import { CURRENCIES, DEFAULT_CURRENCY_CODE, symbolForCurrency } from "@/lib/constants/currencies";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Profile } from "@/lib/types/database.types";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const infoSchema = z.object({
  display_name: z.string().max(80).optional(),
  birth_date: z.string().optional(),
});

type InfoFormValues = z.infer<typeof infoSchema>;
type ProfileTab = "wallet" | "user";

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const upsertProfile = useUpsertProfile();
  const { t } = useT();
  const [tab, setTab] = useState<ProfileTab>("wallet");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("profile.page.title")} />

      <ProfileHeaderCard />

      <Tabs value={tab} onValueChange={(v) => setTab(v as ProfileTab)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="wallet">{t("profile.tabs.wallet")}</TabsTrigger>
          <TabsTrigger value="user">{t("profile.tabs.user")}</TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="flex flex-col gap-4">
          <AccountsWidgetCard />
          <CategoriesWidgetCard />
        </TabsContent>

        <TabsContent value="user" className="flex flex-col gap-4">
          <ProfileInfoCard profile={profile} onSave={(values) => upsertProfile.mutate(values)} saving={upsertProfile.isPending} />
          <PinCard hasPin={!!profile?.pin_hash} userId={user?.id} onSave={(pin_hash) => upsertProfile.mutate({ pin_hash, pin_set_at: new Date().toISOString() })} saving={upsertProfile.isPending} />
          <PasswordCard user={user} />
          <CurrencyCard profile={profile} onSave={(values) => upsertProfile.mutate(values)} saving={upsertProfile.isPending} />
          <PreferencesCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileHeaderCard() {
  const { user } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();
  const { t } = useT();

  async function handleSignOut() {
    clearPinUnlocked();
    await supabase.auth.signOut();
    router.replace(ROUTES.login);
    router.refresh();
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";
  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";

  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <Avatar className="size-14 ring-2 ring-white/70">
          <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email ?? ""} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{name}</p>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.home}>
              <Home className="size-4" />
              {t("layout.backToHome")}
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="size-4" />
            {t("profile.header.signOut")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AccountsWidgetCard() {
  const { t } = useT();
  const { data: accounts } = useAccountsWithBalance();
  const top = (accounts ?? []).slice(0, 4);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{t("profile.accountsWidget.title")}</CardTitle>
        <Link href={ROUTES.accounts} className="flex items-center gap-0.5 text-sm font-semibold text-primary">
          {t("profile.accountsWidget.viewAll")}
          <ChevronRight className="size-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("profile.accountsWidget.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {top.map((account) => {
              const meta = ACCOUNT_TYPE_META[account.type];
              const isDebt = account.type === "debt";
              const displayBalance = isDebt ? Math.abs(account.current_balance) : account.current_balance;
              return (
                <li key={account.id}>
                  <Link
                    href={ROUTES.accountDetail(account.id)}
                    className="flex items-center gap-2.5 transition-opacity active:opacity-70"
                  >
                    <EntityIcon
                      icon={account.icon ?? meta.icon}
                      color={account.color ?? meta.color}
                      className="size-9 rounded-xl"
                      iconClassName="size-4"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{account.name}</span>
                    <span className={cn("shrink-0 text-sm font-bold tabular-nums", isDebt && "text-expense")}>
                      {isDebt && displayBalance !== 0 ? "-" : ""}
                      <AmountTextForAccount amount={displayBalance} account={account} scope="accounts" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function CategoriesWidgetCard() {
  const { t } = useT();
  const { data: categories } = useCategories();
  const top = (categories ?? []).slice(0, 8);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{t("profile.categoriesWidget.title")}</CardTitle>
        <Link href={ROUTES.categories} className="flex items-center gap-0.5 text-sm font-semibold text-primary">
          {t("profile.categoriesWidget.viewAll")}
          <ChevronRight className="size-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("profile.categoriesWidget.empty")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {top.map((category) => {
              const color = normalizeColor(category.color);
              return (
                <span
                  key={category.id}
                  className="glass flex items-center gap-1.5 rounded-full py-1.5 pr-3 pl-1.5 text-xs font-semibold"
                >
                  <EntityIcon icon={category.icon} color={color} className="size-6" iconClassName="size-3" />
                  {category.name}
                </span>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProfileInfoCard({
  profile,
  onSave,
  saving,
}: {
  profile: { display_name: string | null; birth_date: string | null } | undefined;
  onSave: (values: InfoFormValues) => void;
  saving: boolean;
}) {
  const { t } = useT();
  const { register, handleSubmit, reset, watch, setValue } = useForm<InfoFormValues>({
    resolver: zodResolver(infoSchema),
    defaultValues: { display_name: "", birth_date: undefined },
  });
  const birthDate = watch("birth_date");

  useEffect(() => {
    if (!profile) return;
    reset({
      display_name: profile.display_name ?? "",
      birth_date: profile.birth_date ?? undefined,
    });
  }, [profile, reset]);

  function submit(values: InfoFormValues) {
    onSave(values);
    toast.success(t("profile.info.toastSaved"));
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <UserIcon className="size-4.5 text-brand-600" />
        <CardTitle className="text-base">{t("profile.info.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="display_name">{t("profile.info.nameLabel")}</Label>
            <Input id="display_name" placeholder={t("profile.info.namePlaceholder")} {...register("display_name")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="birth_date">{t("profile.info.birthDateLabel")}</Label>
            <DateField
              id="birth_date"
              value={birthDate ?? ""}
              max={toQueryDate(new Date())}
              onChange={(next) => setValue("birth_date", next, { shouldValidate: true })}
            />
          </div>
          <Button type="submit" disabled={saving} className="self-start">
            {saving ? t("common.saving") : t("profile.info.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PinCard({
  hasPin,
  userId,
  onSave,
  saving,
}: {
  hasPin: boolean;
  userId: string | undefined;
  onSave: (pinHash: string) => void;
  saving: boolean;
}) {
  const { t } = useT();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isValidPin(pin)) {
      setError(t("profile.pin.errorLength"));
      return;
    }
    if (pin !== confirmPin) {
      setError(t("profile.pin.errorMismatch"));
      return;
    }
    if (!userId) return;

    const hash = await hashPin(pin, userId);
    onSave(hash);
    setPin("");
    setConfirmPin("");
    toast.success(hasPin ? t("profile.pin.toastChanged") : t("profile.pin.toastSet"));
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <KeyRound className="size-4.5 text-brand-600" />
        <CardTitle className="text-base">{t("profile.pin.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {hasPin && (
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-income">
            <ShieldCheck className="size-4" />
            {t("profile.pin.hasPinBadge")}
          </p>
        )}
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pin">{hasPin ? t("profile.pin.newPinLabel") : t("profile.pin.pinLabel")}</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pin-confirm">{t("profile.pin.confirmLabel")}</Label>
              <Input
                id="pin-confirm"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={saving} className="self-start">
            {saving ? t("common.saving") : hasPin ? t("profile.pin.changePin") : t("profile.pin.setPin")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/** Mật khẩu đăng nhập (khác PIN 6 số ở card "Bảo mật" phía trên — PIN chỉ khoá màn hình, mật khẩu
 * này dùng để đăng nhập lại bằng email khi không đăng nhập được Google). Không yêu cầu nhập lại mật
 * khẩu cũ trước khi đổi — cùng mức rủi ro với đổi PIN ở PinCard, chấp nhận được vì đây là app cá nhân
 * một người dùng, phiên đã qua PinGate mới vào được tới đây. */
function PasswordCard({ user }: { user: SupabaseUser | null }) {
  const { t } = useT();
  const supabase = useSupabase();
  const hasPassword = hasPasswordIdentity(user);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(t("profile.password.errorLength"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("profile.password.errorMismatch"));
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setPassword("");
    setConfirmPassword("");
    toast.success(hasPassword ? t("profile.password.toastChanged") : t("profile.password.toastSet"));
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <Lock className="size-4.5 text-brand-600" />
        <CardTitle className="text-base">{t("profile.password.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {hasPassword && (
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-income">
            <ShieldCheck className="size-4" />
            {t("profile.password.hasPasswordBadge")}
          </p>
        )}
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="account-password">{t("profile.password.newPasswordLabel")}</Label>
              <Input
                id="account-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="account-password-confirm">{t("profile.password.confirmLabel")}</Label>
              <Input
                id="account-password-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={saving} className="self-start">
            {saving ? t("common.saving") : hasPassword ? t("profile.password.changePassword") : t("profile.password.setPassword")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/** Gộp chủ đề / ngôn ngữ / ẩn-hiện số tiền thành 1 card gọn dạng danh sách, thay vì nhiều card riêng — đỡ cuộn dài trên mobile. Đơn vị tiền tách riêng (CurrencyCard) vì cần lưu DB + nút Lưu tường minh. */
function PreferencesCard() {
  const { t, locale, setLocale } = useT();
  const [theme, setTheme] = useTheme();

  const themeOptions: { value: Theme; label: string }[] = [
    { value: "light", label: t("profile.appearance.light") },
    { value: "dark", label: t("profile.appearance.dark") },
    { value: "system", label: t("profile.appearance.system") },
  ];
  const localeOptions: { value: Locale; label: string }[] = [
    { value: "vi", label: t("profile.language.vi") },
    { value: "en", label: t("profile.language.en") },
  ];

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <SlidersHorizontal className="size-4.5 text-brand-600" />
        <CardTitle className="text-base">{t("profile.preferences.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3.5">
        <PreferenceRow label={t("profile.appearance.themeLabel")}>
          <SegmentedControl value={theme} options={themeOptions} onChange={setTheme} />
        </PreferenceRow>
        <PreferenceRow label={t("profile.language.title")}>
          <SegmentedControl value={locale} options={localeOptions} onChange={setLocale} />
        </PreferenceRow>
        <PreferenceRow label={t("profile.amountVisibility.title")}>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="size-9"
              aria-label={t("profile.amountVisibility.showAll")}
              onClick={() => setAllAmountVisibility(true)}
            >
              <Eye className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-9"
              aria-label={t("profile.amountVisibility.hideAll")}
              onClick={() => setAllAmountVisibility(false)}
            >
              <EyeOff className="size-4" />
            </Button>
          </div>
        </PreferenceRow>
      </CardContent>
    </Card>
  );
}

/**
 * Đơn vị tiền dùng để format MỌI số tiền trong app — tách riêng khỏi PreferencesCard (khác các tuỳ chọn
 * local như theme/ngôn ngữ áp dụng ngay) vì đây là dữ liệu lưu DB (profiles.currency_code/currency_symbol),
 * nên cần nút Lưu tường minh (chỉ hiện khi có thay đổi chưa lưu) + toast xác nhận.
 */
function CurrencyCard({
  profile,
  onSave,
  saving,
}: {
  profile: Pick<Profile, "currency_code" | "currency_symbol"> | undefined;
  onSave: (values: { currency_code: string; currency_symbol: string | null }) => void;
  saving: boolean;
}) {
  const { t } = useT();
  const savedCode = profile?.currency_code ?? DEFAULT_CURRENCY_CODE;
  const savedSymbol = profile?.currency_symbol ?? "";

  const [code, setCode] = useState(savedCode);
  const [symbol, setSymbol] = useState(savedSymbol);

  // Đồng bộ khi hồ sơ tải xong / đổi từ nơi khác — điều chỉnh ngay trong lúc render, không dùng effect
  // (giống CurrencyInput), để tránh render thừa.
  const [lastSaved, setLastSaved] = useState({ code: savedCode, symbol: savedSymbol });
  if (lastSaved.code !== savedCode || lastSaved.symbol !== savedSymbol) {
    setLastSaved({ code: savedCode, symbol: savedSymbol });
    setCode(savedCode);
    setSymbol(savedSymbol);
  }

  const isDirty = code !== savedCode || symbol.trim() !== savedSymbol;

  function submit() {
    onSave({ currency_code: code, currency_symbol: symbol.trim() || null });
    toast.success(t("profile.currency.toastSaved"));
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <Coins className="size-4.5 text-brand-600" />
        <CardTitle className="text-base">{t("profile.currency.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>{t("profile.currency.selectLabel")}</Label>
          <Select value={code} onValueChange={setCode}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {t(`currency.${c.code}.name`)} ({c.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="currency-symbol">{t("profile.currency.customSymbolLabel")}</Label>
          <Input
            id="currency-symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder={symbolForCurrency(code)}
            maxLength={8}
          />
        </div>

        {isDirty && (
          <Button onClick={submit} disabled={saving} className="self-start">
            {saving ? t("common.saving") : t("profile.currency.save")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function PreferenceRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="shrink-0">{label}</Label>
      {children}
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-full border border-input bg-card/60 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold transition-all active:scale-95",
            value === option.value
              ? "bg-brand-600 text-white shadow-soft"
              : "text-muted-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
