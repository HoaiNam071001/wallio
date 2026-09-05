"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabase } from "@/lib/hooks/use-supabase";
import { useT } from "@/lib/i18n/use-t";
import { ROUTE_PARAMS, ROUTES } from "@/lib/constants/routes";
import { nextDestination } from "@/lib/utils/pwa";

const signupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "mismatch",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export function EmailSignupForm() {
  const { t } = useT();
  const supabase = useSupabase();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupFormValues) {
    setFormError(null);
    setSubmitting(true);
    const next = nextDestination();
    const redirectTo = `${window.location.origin}${ROUTES.authCallback}?${ROUTE_PARAMS.next}=${encodeURIComponent(next)}`;
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { emailRedirectTo: redirectTo },
    });
    setSubmitting(false);

    if (error) {
      setFormError(/registered|exists/i.test(error.message) ? t("auth.signup.errorAlreadyRegistered") : error.message);
      return;
    }
    // Supabase trả về "thành công" với identities rỗng khi email đã tồn tại (chống dò email) thay
    // vì báo lỗi thẳng — phải tự suy ra trường hợp này từ đó.
    if (data.user && data.user.identities?.length === 0) {
      setFormError(t("auth.signup.errorAlreadyRegistered"));
      return;
    }
    if (data.session) {
      router.replace(next);
      router.refresh();
      return;
    }
    setPendingConfirmation(true);
  }

  if (pendingConfirmation) {
    return (
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <MailCheck className="size-8 text-brand-600" />
        <p className="text-sm text-muted-foreground">{t("auth.signup.pendingConfirmation")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 text-left">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-email">{t("auth.emailLogin.emailLabel")}</Label>
        <Input id="signup-email" type="email" autoComplete="email" {...register("email")} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-password">{t("auth.emailLogin.passwordLabel")}</Label>
        <Input id="signup-password" type="password" autoComplete="new-password" {...register("password")} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-confirm">{t("auth.signup.confirmPasswordLabel")}</Label>
        <Input id="signup-confirm" type="password" autoComplete="new-password" {...register("confirmPassword")} />
      </div>
      {errors.confirmPassword && <p className="text-sm text-destructive">{t("auth.signup.errorMismatch")}</p>}
      {formError && <p className="text-sm text-destructive">{formError}</p>}
      <Button type="submit" className="mt-1 w-full" disabled={submitting}>
        {submitting ? t("auth.login.redirecting") : t("auth.signup.submit")}
      </Button>
    </form>
  );
}
