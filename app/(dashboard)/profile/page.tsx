"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, KeyRound, ShieldCheck, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/lib/hooks/use-auth";
import { useProfile, useUpsertProfile } from "@/lib/hooks/use-profile";
import { setAllAmountVisibility } from "@/lib/hooks/use-amount-visibility";
import { hashPin, isValidPin } from "@/lib/utils/pin";

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

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Hồ sơ" subtitle={user?.email ?? undefined} />

      <ProfileInfoCard profile={profile} onSave={(values) => upsertProfile.mutate(values)} saving={upsertProfile.isPending} />
      <PinCard hasPin={!!profile?.pin_hash} userId={user?.id} onSave={(pin_hash) => upsertProfile.mutate({ pin_hash, pin_set_at: new Date().toISOString() })} saving={upsertProfile.isPending} />
      <AmountVisibilityCard />
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
    toast.success("Đã lưu hồ sơ");
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <UserIcon className="size-4.5 text-brand-600" />
        <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="display_name">Tên hiển thị</Label>
            <Input id="display_name" placeholder="Tên của bạn" {...register("display_name")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="birth_year">Năm sinh</Label>
            <Input
              id="birth_year"
              type="number"
              placeholder="VD: 1995"
              {...register("birth_year", { valueAsNumber: true })}
            />
          </div>
          <Button type="submit" disabled={saving} className="self-start">
            {saving ? "Đang lưu..." : "Lưu hồ sơ"}
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
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isValidPin(pin)) {
      setError("Mật khẩu phải gồm đúng 6 số");
      return;
    }
    if (pin !== confirmPin) {
      setError("Hai mật khẩu chưa khớp nhau");
      return;
    }
    if (!userId) return;

    const hash = await hashPin(pin, userId);
    onSave(hash);
    setPin("");
    setConfirmPin("");
    toast.success(hasPin ? "Đã đổi mật khẩu" : "Đã đặt mật khẩu");
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <KeyRound className="size-4.5 text-brand-600" />
        <CardTitle className="text-base">Bảo mật</CardTitle>
      </CardHeader>
      <CardContent>
        {hasPin && (
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-income">
            <ShieldCheck className="size-4" />
            Đã đặt mật khẩu 6 số
          </p>
        )}
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pin">{hasPin ? "Mật khẩu mới" : "Mật khẩu 6 số"}</Label>
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
              <Label htmlFor="pin-confirm">Nhập lại mật khẩu</Label>
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
            {saving ? "Đang lưu..." : hasPin ? "Đổi mật khẩu" : "Đặt mật khẩu"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AmountVisibilityCard() {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <Eye className="size-4.5 text-brand-600" />
        <CardTitle className="text-base">Hiển thị số tiền</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">
          Áp dụng cho tất cả các trang cùng lúc. Mỗi trang cũng có nút ẩn/hiện riêng ở tiêu đề.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAllAmountVisibility(true)}>
            <Eye className="size-4" />
            Hiện tất cả
          </Button>
          <Button variant="outline" onClick={() => setAllAmountVisibility(false)}>
            <EyeOff className="size-4" />
            Ẩn tất cả
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
