"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LeagueIcon, type LeagueIconName } from "@/components/ui/LeagueIcon";

export type PrimaryNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LeagueIconName;
};

type ResponsiveNavigationProps = {
  items: PrimaryNavItem[];
  sidebarItems?: PrimaryNavItem[];
};

function isActivePath(pathname: string, href: string) {
  if (href === "/home") return pathname === "/" || pathname === "/home";
  if (href === "/profile") return pathname === "/profile" || pathname.startsWith("/profile/");
  if (href === "/topics") return pathname === "/topics" || pathname.startsWith("/topics/") || pathname.startsWith("/weekly");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function bottomItemClass(isActive: boolean) {
  return [
    "group flex min-h-[3.75rem] min-w-0 flex-col items-center justify-center rounded-2xl px-1 py-1.5 text-center transition focus:outline-none focus:ring-2 focus:ring-amber-200/35",
    isActive
      ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(215,180,106,0.24)]"
      : "text-league-muted hover:bg-white/[0.055] hover:text-white",
  ].join(" ");
}

function sidebarItemClass(isActive: boolean) {
  return [
    "group flex min-h-12 items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-amber-200/35",
    isActive
      ? "border border-amber-200/22 bg-amber-200/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
      : "border border-transparent text-league-silver hover:border-white/10 hover:bg-white/[0.055] hover:text-white",
  ].join(" ");
}

export function ResponsiveNavigation({ items, sidebarItems = items }: ResponsiveNavigationProps) {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[17.5rem] border-r border-white/[0.08] bg-[#05070d]/90 px-4 py-5 shadow-[18px_0_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl lg:block" aria-label="デスクトップナビゲーション">
        <Link href="/" className="group flex items-center gap-3 rounded-[1.35rem] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.018))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_44px_rgba(0,0,0,0.24)] transition hover:border-amber-200/24" aria-label="Logic League ホームへ">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-100/20 bg-[radial-gradient(circle_at_30%_20%,rgba(215,180,106,0.28),transparent_42%),linear-gradient(145deg,#0c1019,#020204)]">
            <Image src="/logo.png" alt="" width={56} height={56} className="h-full w-full scale-[1.18] rounded-full object-cover drop-shadow-[0_0_14px_rgba(215,180,106,0.22)]" priority />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-black uppercase tracking-[0.22em] text-white">Logic League</span>
            <span className="mt-1 block text-xs font-bold text-league-muted">思考で競うリーグ</span>
          </span>
        </Link>

        <nav className="mt-6 space-y-1.5">
          {sidebarItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} className={sidebarItemClass(active)} aria-current={active ? "page" : undefined}>
                <LeagueIcon name={item.icon} size={20} className={active ? "text-league-gold" : "text-league-silver/70 group-hover:text-league-gold/85"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-4 bottom-5 rounded-[1.35rem] border border-amber-300/16 bg-[radial-gradient(circle_at_top,rgba(215,180,106,0.13),transparent_55%),rgba(255,255,255,0.035)] p-4">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-league-gold">League Mode</p>
          <p className="mt-2 text-sm font-bold leading-6 text-league-silver">長文の読解・回答・ランキング分析に集中できるデスクトップ設計です。</p>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-[#05070d]/92 px-2 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-14px_42px_rgba(0,0,0,0.46)] backdrop-blur-2xl sm:px-4 lg:hidden" aria-label="モバイルナビゲーション">
        <div className="mx-auto grid w-full max-w-4xl grid-cols-5 gap-1 [grid-template-columns:repeat(5,minmax(0,1fr))]">
          {items.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} className={bottomItemClass(active)} aria-current={active ? "page" : undefined}>
                <LeagueIcon name={item.icon} size={19} className={active ? "text-league-gold" : "text-league-silver/70 group-hover:text-league-gold/85"} />
                <span className="mt-1 w-full truncate text-[0.58rem] font-black leading-none tracking-[-0.04em]">{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
