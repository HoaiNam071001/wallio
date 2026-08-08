import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ROUTE_PARAMS, ROUTES } from "@/lib/constants/routes";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get(ROUTE_PARAMS.code);
  // Mặc định về trang chủ nếu thiếu next (không nên xảy ra vì login page luôn set next dựa trên
  // standalone hay không) — trang chủ tự redirect thẳng vào app khi đang chạy standalone nên vẫn an toàn.
  const next = searchParams.get(ROUTE_PARAMS.next) ?? ROUTES.home;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}${ROUTES.login}?${ROUTE_PARAMS.error}=auth`);
}
