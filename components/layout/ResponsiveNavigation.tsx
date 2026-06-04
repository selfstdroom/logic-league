"use client";

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
  userEmail?: string | null;
  publicProfileHref: string;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/home") return pathname === "/" || pathname === "/home";
  if (href === "/profile") return pathname === "/profile" || pathname.startsWith("/profile/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function desktopItemClass(isActive: boolean) {
  return [
    "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-amber-200/35 xl:px-4",
    isActive
      ? "border border-amber-300/35 bg-amber-300/[0.12] text-white shadow-[0_0_28px_rgba(215,180,106,0.14)]"
      : "text-league-silver hover:bg-white/10 hover:text-white",
  ].join(" ");
}

function bottomItemClass(isActive: boolean) {
  return [
    "group flex min-w-0 flex-col items-center justify-center rounded-2xl px-1.5 py-2 text-center transition focus:outline-none focus:ring-2 focus:ring-amber-200/35 sm:px-2.5 sm:py-2.5",
    isActive
      ? "bg-[linear-gradient(180deg,rgba(215,180,106,0.20),rgba(255,255,255,0.06))] text-white shadow-[inset_0_0_0_1px_rgba(215,180,106,0.28),0_10px_26px_rgba(0,0,0,0.22)]"
      : "text-league-muted hover:bg-white/[0.07] hover:text-white",
  ].join(" ");
}

export function ResponsiveNavigation({ items, userEmail, publicProfileHref }: ResponsiveNavigationProps) {
  const pathname = usePathname();

  return (
    <>
      <nav className="hidden min-w-0 flex-1 items-center justify-end gap-1 text-sm lg:flex" aria-label="デスクトップナビゲーション">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link key={item.href} className={desktopItemClass(active)} href={item.href} aria-current={active ? "page" : undefined}>
              <LeagueIcon name={item.icon} size={17} className={active ? "text-league-gold" : "text-league-gold/75"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <form action="/search" className="hidden items-center rounded-full border border-white/10 bg-black/25 px-3 py-1.5 xl:flex">
          <input name="q" aria-label="検索" placeholder="検索" className="w-24 bg-transparent text-xs font-bold text-white outline-none placeholder:text-league-muted 2xl:w-36" />
          <button className="text-xs font-black text-league-gold">検索</button>
        </form>
        {userEmail ? (
          <Link className="hidden max-w-[11rem] truncate rounded-full border border-white/10 px-3 py-2 font-bold text-league-muted transition hover:border-amber-300/30 hover:text-white xl:inline" href={publicProfileHref}>{userEmail}</Link>
        ) : <Link className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 font-bold text-league-gold transition hover:bg-amber-300/20" href="/login">ログイン</Link>}
      </nav>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#05070d]/92 px-2 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_60px_rgba(0,0,0,0.56)] backdrop-blur-2xl sm:px-4 md:px-6 lg:hidden" aria-label="モバイル・タブレットナビゲーション">
        <div className="mx-auto grid w-full max-w-3xl grid-cols-5 gap-1 sm:gap-2">
          {items.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} className={bottomItemClass(active)} aria-current={active ? "page" : undefined}>
                <LeagueIcon name={item.icon} size={20} className={active ? "text-league-gold drop-shadow-[0_0_10px_rgba(215,180,106,0.34)]" : "text-league-silver/75 group-hover:text-league-gold/85"} />
                <span className="mt-1 w-full truncate text-[0.62rem] font-black leading-none tracking-[-0.02em] sm:text-[0.7rem] sm:tracking-normal">{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
