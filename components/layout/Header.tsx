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
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3">
          <Link href="/" className="group inline-flex min-w-0 items-center justify-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition hover:border-white/15 hover:bg-white/[0.055] focus:outline-none focus:ring-2 focus:ring-amber-200/35" aria-label="Logic League ホームへ">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-amber-100/15 bg-black/25 sm:h-10 sm:w-10">
              <Image
                src="/icon.png"
                alt=""
                width={40}
                height={40}
                className="h-7 w-7 object-contain drop-shadow-[0_0_14px_rgba(215,180,106,0.2)] transition group-hover:scale-[1.03] sm:h-8 sm:w-8"
                priority
              />
            </span>
            <span className="text-sm font-black uppercase tracking-[0.22em] text-white sm:text-base">Logic League</span>
          </Link>
        </div>
      </header>
      <ResponsiveNavigation items={navItems} />
    </>
  );
}
