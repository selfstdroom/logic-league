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
};

function isActivePath(pathname: string, href: string) {
  if (href === "/home") return pathname === "/" || pathname === "/home";
  if (href === "/profile") return pathname === "/profile" || pathname.startsWith("/profile/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function bottomItemClass(isActive: boolean) {
  return [
    "group flex min-w-0 flex-col items-center justify-center rounded-2xl px-1.5 py-1.5 text-center transition focus:outline-none focus:ring-2 focus:ring-amber-200/35 sm:px-2.5 sm:py-2",
    isActive
      ? "bg-white/[0.07] text-white shadow-[inset_0_0_0_1px_rgba(215,180,106,0.20)]"
      : "text-league-muted hover:bg-white/[0.055] hover:text-white",
  ].join(" ");
}

export function ResponsiveNavigation({ items }: ResponsiveNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-[#05070d]/86 px-2 pb-[calc(0.4rem+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-14px_42px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:px-4 md:px-6" aria-label="メインナビゲーション">
      <div className="mx-auto grid w-full max-w-4xl grid-cols-5 gap-1 [grid-template-columns:repeat(5,minmax(0,1fr))] sm:gap-1.5">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link key={item.href} href={item.href} className={bottomItemClass(active)} aria-current={active ? "page" : undefined}>
              <LeagueIcon name={item.icon} size={19} className={active ? "text-league-gold" : "text-league-silver/70 group-hover:text-league-gold/85"} />
              <span className="mt-1 w-full truncate text-[0.6rem] font-black leading-none tracking-[-0.02em] sm:text-[0.68rem] sm:tracking-normal">{item.shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
