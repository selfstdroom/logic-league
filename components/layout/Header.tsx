import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import type { LeagueIconName } from "@/components/ui/LeagueIcon";
import { ResponsiveNavigation, type PrimaryNavItem } from "@/components/layout/ResponsiveNavigation";

const navItems: PrimaryNavItem[] = [
  { href: "/home", label: "ホーム", shortLabel: "ホーム", icon: "home" as LeagueIconName },
  { href: "/timeline", label: "タイムライン", shortLabel: "タイムライン", icon: "timeline" as LeagueIconName },
  { href: "/search", label: "検索", shortLabel: "検索", icon: "search" as LeagueIconName },
];

const settingsNavItem: PrimaryNavItem = { href: "/settings", label: "設定", shortLabel: "設定", icon: "settings" as LeagueIconName };

function myPageItem(href: string) {
  return { href, label: "マイページ", shortLabel: "マイページ", icon: "profile" as LeagueIconName };
}

export async function Header() {
  const data = { user: null as { id: string; email?: string | null } | null, username: null as string | null };
  if (hasSupabasePublicEnv()) {
    const supabase = await createClient();
    const response = await supabase.auth.getUser();
    data.user = response.data.user;
    if (data.user) {
      const { data: profile } = await supabase.from("profiles").select("username").eq("id", data.user.id).maybeSingle();
      data.username = profile?.username ?? null;
    }
  }

  const profileHref = "/profile";
  const publicProfileHref = data.username ? `/profile/${data.username}` : "/profile";
  const primaryNavItems = [...navItems, myPageItem(profileHref), settingsNavItem];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#05070d]/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="group inline-flex min-w-0 items-center gap-2.5 text-sm font-black tracking-[0.2em] text-league-gold sm:text-lg sm:tracking-[0.24em]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-300/35 bg-amber-300/10 text-[0.68rem] shadow-[0_0_24px_rgba(215,180,106,0.16)] sm:h-9 sm:w-9 sm:rounded-xl sm:text-sm">LL</span>
            <span className="truncate transition group-hover:text-white">LOGIC LEAGUE</span>
          </Link>
          <ResponsiveNavigation items={primaryNavItems} userEmail={data.user?.email ?? null} publicProfileHref={publicProfileHref} />
          <Link className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-league-silver transition hover:border-amber-300/30 hover:text-white lg:hidden" href={data.user ? profileHref : "/login"}>
            {data.user ? "プロフィール" : "ログイン"}
          </Link>
        </div>
      </header>
    </>
  );
}
