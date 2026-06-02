import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function makeUsername(email?: string | null, userId?: string) {
  const base = email?.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 20) || "player";
  return `${base}_${userId?.slice(0, 8)}`.toLowerCase();
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/exam";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email ?? null,
        username: makeUsername(user.email, user.id),
        display_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Logic Player",
        avatar_url: user.user_metadata?.avatar_url ?? null,
      }, { onConflict: "id" });
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
