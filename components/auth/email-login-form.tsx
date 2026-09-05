"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabase } from "@/lib/hooks/use-supabase";
import { useT } from "@/lib/i18n/use-t";
import { nextDestination } from "@/lib/utils/pwa";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function EmailLoginForm() {
  const { t } = useT();
  const supabase = useSupabase();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setSubmitting(false);
    if (error) {
      setFormError(t("auth.emailLogin.errorInvalid"));
      return;
    }
    router.replace(nextDestination());
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 text-left">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email">{t("auth.emailLogin.emailLabel")}</Label>
        <Input id="login-email" type="email" autoComplete="email" {...register("email")} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-password">{t("auth.emailLogin.passwordLabel")}</Label>
        <Input id="login-password" type="password" autoComplete="current-password" {...register("password")} />
      </div>
      {(errors.email || errors.password || formError) && (
        <p className="text-sm text-destructive">{formError ?? t("auth.emailLogin.errorInvalid")}</p>
      )}
      <Button type="submit" className="mt-1 w-full" disabled={submitting}>
        {submitting ? t("auth.login.redirecting") : t("auth.emailLogin.submit")}
      </Button>
    </form>
  );
}
