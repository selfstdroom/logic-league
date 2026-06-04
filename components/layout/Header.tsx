import Link from "next/link";
import type { LeagueIconName } from "@/components/ui/LeagueIcon";
import { ResponsiveNavigation, type PrimaryNavItem } from "@/components/layout/ResponsiveNavigation";

const navItems: PrimaryNavItem[] = [
  { href: "/home", label: "ホーム", shortLabel: "ホーム", icon: "home" as LeagueIconName },
  { href: "/timeline", label: "タイムライン", shortLabel: "タイムライン", icon: "timeline" as LeagueIconName },
  { href: "/search", label: "検索", shortLabel: "検索", icon: "search" as LeagueIconName },
  { href: "/profile", label: "マイページ", shortLabel: "マイページ", icon: "profile" as LeagueIconName },
  { href: "/settings", label: "設定", shortLabel: "設定", icon: "settings" as LeagueIconName },
];

export function Header() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05070d]/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="group inline-flex min-w-0 items-center gap-2.5 text-sm font-black tracking-[0.2em] text-league-gold sm:text-lg sm:tracking-[0.24em]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-300/35 bg-amber-300/10 text-[0.68rem] shadow-[0_0_24px_rgba(215,180,106,0.16)] sm:h-9 sm:w-9 sm:rounded-xl sm:text-sm">LL</span>
            <span className="truncate transition group-hover:text-white">LOGIC LEAGUE</span>
          </Link>
        </div>
      </header>
      <ResponsiveNavigation items={navItems} />
    </>
  );
}
