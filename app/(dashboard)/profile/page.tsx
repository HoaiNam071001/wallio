"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, KeyRound, Languages, Palette, ShieldCheck, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/lib/hooks/use-auth";
import { useProfile, useUpsertProfile } from "@/lib/hooks/use-profile";
import { setAllAmountVisibility } from "@/lib/hooks/use-amount-visibility";
import { useTheme, type Theme } from "@/lib/hooks/use-theme";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Locale } from "@/lib/i18n/locale-store";
import { hashPin, isValidPin } from "@/lib/utils/pin";
import { cn } from "@/lib/utils";

const infoSchema = z.object({
  display_name: z.string().max(80).optional(),
  birth_year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .optional(),
});

type InfoFormValues = z.infer<typeof infoSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const upsertProfile = useUpsertProfile();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t.profile.page.title} subtitle={user?.email ?? undefined} />

      <ProfileInfoCard profile={profile} onSave={(values) => upsertProfile.mutate(values)} saving={upsertProfile.isPending} />
      <PinCard hasPin={!!profile?.pin_hash} userId={user?.id} onSave={(pin_hash) => upsertProfile.mutate({ pin_hash, pin_set_at: new Date().toISOString() })} saving={upsertProfile.isPending} />
      <AmountVisibilityCard />
      <AppearanceCard />
      <LanguageCard />
    </div>
  );
}

function ProfileInfoCard({
  profile,
  onSave,
  saving,
}: {
  profile: { display_name: string | null; birth_year: number | null } | undefined;
  onSave: (values: InfoFormValues) => void;
  saving: boolean;
}) {
  const { t } = useTranslation();
  const { register, handleSubmit, reset } = useForm<InfoFormValues>({
    resolver: zodResolver(infoSchema),
    defaultValues: { display_name: "", birth_year: undefined },
  });

  useEffect(() => {
    if (!profile) return;
    reset({
      display_name: profile.display_name ?? "",
      birth_year: profile.birth_year ?? undefined,
    });
  }, [profile, reset]);

  function submit(values: InfoFormValues) {
    onSave(values);
    toast.success(t.profile.info.toastSaved);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <UserIcon className="size-4.5 text-brand-600" />
        <CardTitle className="text-base">{t.profile.info.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="display_name">{t.profile.info.nameLabel}</Label>
            <Input id="display_name" placeholder={t.profile.info.namePlaceholder} {...register("display_name")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="birth_year">{t.profile.info.birthYearLabel}</Label>
            <Input
              id="birth_year"
              type="number"
              placeholder={t.profile.info.birthYearPlaceholder}
              {...register("birth_year", { valueAsNumber: true })}
            />
          </div>
          <Button type="submit" disabled={saving} className="self-start">
            {saving ? t.common.saving : t.profile.info.save}
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
  const { t } = useTranslation();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isValidPin(pin)) {
      setError(t.profile.pin.errorLength);
      return;
    }
    if (pin !== confirmPin) {
      setError(t.profile.pin.errorMismatch);
      return;
    }
    if (!userId) return;

    const hash = await hashPin(pin, userId);
    onSave(hash);
    setPin("");
    setConfirmPin("");
    toast.success(hasPin ? t.profile.pin.toastChanged : t.profile.pin.toastSet);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <KeyRound className="size-4.5 text-brand-600" />
        <CardTitle className="text-base">{t.profile.pin.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {hasPin && (
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-income">
            <ShieldCheck className="size-4" />
            {t.profile.pin.hasPinBadge}
          </p>
        )}
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pin">{hasPin ? t.profile.pin.newPinLabel : t.profile.pin.pinLabel}</Label>
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
              <Label htmlFor="pin-confirm">{t.profile.pin.confirmLabel}</Label>
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
            {saving ? t.common.saving : hasPin ? t.profile.pin.changePin : t.profile.pin.setPin}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AmountVisibilityCard() {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <Eye className="size-4.5 text-brand-600" />
        <CardTitle className="text-base">{t.profile.amountVisibility.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">{t.profile.amountVisibility.description}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAllAmountVisibility(true)}>
            <Eye className="size-4" />
            {t.profile.amountVisibility.showAll}
          </Button>
          <Button variant="outline" onClick={() => setAllAmountVisibility(false)}>
            <EyeOff className="size-4" />
            {t.profile.amountVisibility.hideAll}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AppearanceCard() {
  const { t } = useTranslation();
  const [theme, setTheme] = useTheme();

  const options: { value: Theme; label: string }[] = [
    { value: "light", label: t.profile.appearance.light },
    { value: "dark", label: t.profile.appearance.dark },
    { value: "system", label: t.profile.appearance.system },
  ];

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <Palette className="size-4.5 text-brand-600" />
        <CardTitle className="text-base">{t.profile.appearance.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Label className="mb-2 block">{t.profile.appearance.themeLabel}</Label>
        <div className="grid grid-cols-3 gap-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={cn(
                "rounded-2xl border p-2.5 text-sm font-semibold transition-all active:scale-95",
                theme === option.value
                  ? "border-transparent bg-brand-600 text-white shadow-soft"
                  : "border-input bg-card/60 text-muted-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LanguageCard() {
  const { t, locale, setLocale } = useTranslation();

  const options: { value: Locale; label: string }[] = [
    { value: "vi", label: t.profile.language.vi },
    { value: "en", label: t.profile.language.en },
  ];

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <Languages className="size-4.5 text-brand-600" />
        <CardTitle className="text-base">{t.profile.language.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setLocale(option.value)}
              className={cn(
                "rounded-2xl border p-2.5 text-sm font-semibold transition-all active:scale-95",
                locale === option.value
                  ? "border-transparent bg-brand-600 text-white shadow-soft"
                  : "border-input bg-card/60 text-muted-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
