import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

const navItems = [
  { href: "/home", label: "ホーム", shortLabel: "ホーム", icon: "◆" },
  { href: "/topics", label: "Topics", shortLabel: "Topics", icon: "◇" },
  { href: "/timeline", label: "Timeline", shortLabel: "Time", icon: "✦" },
  { href: "/profile", label: "プロフィール", shortLabel: "Profile", icon: "◈" },
  { href: "/exam", label: "認定試験", shortLabel: "試験", icon: "△" },
];

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

  const profileHref = data.username ? `/profile/${data.username}` : "/profile";
  const resolvedNavItems = navItems.map((item) => item.href === "/profile" ? { ...item, href: profileHref } : item);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#05070d]/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="group inline-flex min-w-0 items-center gap-2.5 text-sm font-black tracking-[0.2em] text-league-gold sm:text-lg sm:tracking-[0.24em]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-300/35 bg-amber-300/10 text-[0.68rem] shadow-[0_0_24px_rgba(215,180,106,0.16)] sm:h-9 sm:w-9 sm:rounded-xl sm:text-sm">LL</span>
            <span className="truncate transition group-hover:text-white">LOGIC LEAGUE</span>
          </Link>
          <nav className="hidden items-center gap-2 text-sm text-league-silver md:flex md:justify-end">
            {resolvedNavItems.map((item) => (
              <Link key={item.label} className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white" href={item.href}>{item.label}</Link>
            ))}
            <Link className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white" href="/weekly">Weekly</Link>
            {data.user ? <span className="hidden max-w-48 truncate rounded-full border border-white/10 px-3 py-2 text-league-muted lg:inline">{data.user.email}</span> : <Link className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 font-bold text-league-gold transition hover:bg-amber-300/20" href="/login">ログイン</Link>}
          </nav>
          <Link className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-league-silver transition hover:border-amber-300/30 hover:text-white md:hidden" href={data.user ? profileHref : "/login"}>
            {data.user ? "Profile" : "ログイン"}
          </Link>
        </div>
      </header>
      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-2xl border border-white/10 bg-[#05070d]/90 p-1.5 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:hidden">
        {resolvedNavItems.map((item) => (
          <Link key={item.label} href={item.href} className="flex flex-col items-center justify-center rounded-xl px-2 py-2 text-[0.65rem] font-bold text-league-muted transition hover:bg-white/[0.07] hover:text-white">
            <span className="text-[0.7rem] text-league-gold/80">{item.icon}</span>
            <span className="mt-0.5">{item.shortLabel}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
