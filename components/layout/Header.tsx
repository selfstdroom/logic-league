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
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05070d]/90 shadow-[0_12px_36px_rgba(0,0,0,0.28)] backdrop-blur-2xl lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-3 py-1.5 sm:px-6 sm:py-2">
          <Link href="/" className="group inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-[linear-gradient(135deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] px-2.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_34px_rgba(0,0,0,0.22)] transition hover:border-amber-200/25 hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-amber-200/35 sm:gap-2.5 sm:px-3 sm:py-2" aria-label="Logic League ホームへ">
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-100/20 bg-[radial-gradient(circle_at_30%_20%,rgba(215,180,106,0.28),transparent_42%),linear-gradient(145deg,#0c1019,#020204)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_20px_rgba(215,180,106,0.12)] sm:h-8 sm:w-8">
              <Image src="/logo.png" alt="" width={40} height={40} className="h-full w-full scale-[1.18] rounded-full object-cover drop-shadow-[0_0_14px_rgba(215,180,106,0.22)] transition group-hover:scale-[1.17]" priority />
            </span>
            <span className="text-[0.78rem] font-black uppercase tracking-[0.2em] text-white [text-shadow:0_0_18px_rgba(215,180,106,0.12)] sm:text-base sm:tracking-[0.22em]">Logic League</span>
          </Link>
        </div>
      </header>
      <ResponsiveNavigation items={mobileNavItems} sidebarItems={desktopNavItems} />
    </>
  );
}
