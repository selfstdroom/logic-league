import Image from "next/image";
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
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05070d]/86 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="group inline-flex min-w-0 items-center justify-center rounded-2xl px-3 py-1.5 transition hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-amber-200/35" aria-label="Logic League ホームへ">
            <Image
              src="/logo.png"
              alt="Logic League"
              width={40}
              height={40}
              className="h-8 w-8 object-contain drop-shadow-[0_0_18px_rgba(215,180,106,0.18)] transition group-hover:scale-[1.03] sm:h-9 sm:w-9 lg:h-10 lg:w-10"
              priority
            />
            <span className="sr-only">Logic League</span>
          </Link>
        </div>
      </header>
      <ResponsiveNavigation items={navItems} />
    </>
  );
}
