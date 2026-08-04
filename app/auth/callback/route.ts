import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ROUTE_PARAMS, ROUTES } from "@/lib/constants/routes";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get(ROUTE_PARAMS.code);
  const next = searchParams.get(ROUTE_PARAMS.next) ?? ROUTES.dashboard;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}${ROUTES.login}?${ROUTE_PARAMS.error}=auth`);
}
