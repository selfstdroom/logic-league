import Image from "next/image";
import Link from "next/link";
import type { LeagueIconName } from "@/components/ui/LeagueIcon";
import { ResponsiveNavigation, type PrimaryNavItem } from "@/components/layout/ResponsiveNavigation";

const mobileNavItems: PrimaryNavItem[] = [
  { href: "/home", label: "ホーム", shortLabel: "Home", icon: "home" as LeagueIconName },
  { href: "/timeline", label: "タイムライン", shortLabel: "Timeline", icon: "timeline" as LeagueIconName },
  { href: "/search", label: "検索", shortLabel: "Search", icon: "search" as LeagueIconName },
  { href: "/profile", label: "プロフィール", shortLabel: "Profile", icon: "profile" as LeagueIconName },
  { href: "/settings", label: "設定", shortLabel: "Settings", icon: "settings" as LeagueIconName },
];

const desktopNavItems: PrimaryNavItem[] = [
  { href: "/home", label: "Home", shortLabel: "Home", icon: "home" as LeagueIconName },
  { href: "/timeline", label: "Timeline", shortLabel: "Timeline", icon: "timeline" as LeagueIconName },
  { href: "/topics", label: "Discussions", shortLabel: "Discussions", icon: "dailyDiscussions" as LeagueIconName },
  { href: "/leaderboard", label: "Rankings", shortLabel: "Rankings", icon: "leaderboard" as LeagueIconName },
  { href: "/hall-of-fame", label: "Hall of Fame", shortLabel: "Hall", icon: "hallOfFame" as LeagueIconName },
  { href: "/profile", label: "Profile", shortLabel: "Profile", icon: "profile" as LeagueIconName },
  { href: "/settings", label: "Settings", shortLabel: "Settings", icon: "settings" as LeagueIconName },
];

export function Header() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#05070d]/72 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex h-11 max-w-7xl items-center px-4 sm:h-12 sm:px-6">
          <Link href="/home" className="group inline-flex min-w-0 items-center gap-2.5 transition focus:outline-none focus:ring-2 focus:ring-amber-200/35" aria-label="Logic League ホームへ">
            <Image src="/icon.png" alt="" width={32} height={32} className="h-7 w-7 shrink-0 rounded-lg object-cover shadow-[0_0_18px_rgba(255,255,255,0.08)] transition group-hover:brightness-110 sm:h-8 sm:w-8" priority />
            <span className="truncate text-[0.78rem] font-black uppercase tracking-[0.24em] text-white [text-shadow:0_0_16px_rgba(255,255,255,0.12)] sm:text-sm sm:tracking-[0.26em]">Logic League</span>
          </Link>
        </div>
      </header>
      <ResponsiveNavigation items={mobileNavItems} sidebarItems={desktopNavItems} />
    </>
  );
}
