"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ResponsiveNavigation, type PrimaryNavItem } from "@/components/layout/ResponsiveNavigation";
import { NAV_CONFIG_STORAGE_KEY, defaultNavigationIds, itemsFromIds, parseStoredNavigation } from "@/lib/navigation";

const desktopNavItems: PrimaryNavItem[] = [
  { href: "/home", label: "ホーム", shortLabel: "Home", icon: "home" },
  { href: "/timeline", label: "タイムライン", shortLabel: "Timeline", icon: "timeline" },
  { href: "/topics", label: "議論", shortLabel: "議論", icon: "dailyDiscussions" },
  { href: "/weekly", label: "競技議論", shortLabel: "競技", icon: "weeklyLeague" },
  { href: "/leaderboard", label: "ランキング", shortLabel: "Rank", icon: "leaderboard" },
  { href: "/hall-of-fame", label: "殿堂", shortLabel: "殿堂", icon: "hallOfFame" },
  { href: "/profile", label: "マイページ", shortLabel: "Profile", icon: "profile" },
  { href: "/settings", label: "設定", shortLabel: "Settings", icon: "settings" },
];

export function Header() {
  const [selectedIds, setSelectedIds] = useState(defaultNavigationIds);

  useEffect(() => {
    const load = () => setSelectedIds(parseStoredNavigation(window.localStorage.getItem(NAV_CONFIG_STORAGE_KEY)));
    load();
    window.addEventListener("storage", load);
    window.addEventListener("logic-league-nav-updated", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("logic-league-nav-updated", load);
    };
  }, []);

  const mobileNavItems = useMemo(() => itemsFromIds(selectedIds), [selectedIds]);
  const hasSettings = selectedIds.includes("settings");

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#05070d]/72 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex h-11 max-w-7xl items-center justify-between gap-3 px-4 sm:h-12 sm:px-6">
          <Link href="/home" className="group inline-flex min-w-0 items-center gap-2.5 transition focus:outline-none focus:ring-2 focus:ring-amber-200/35" aria-label="Logic League ホームへ">
            <Image src="/icon.png" alt="" width={32} height={32} className="h-7 w-7 shrink-0 rounded-lg object-cover shadow-[0_0_18px_rgba(255,255,255,0.08)] transition group-hover:brightness-110 sm:h-8 sm:w-8" priority />
            <span className="truncate text-[0.78rem] font-black uppercase tracking-[0.24em] text-white [text-shadow:0_0_16px_rgba(255,255,255,0.12)] sm:text-sm sm:tracking-[0.26em]">Logic League</span>
          </Link>
          {!hasSettings ? (
            <Link href="/settings" className="shrink-0 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-xs font-black text-league-gold">
              設定
            </Link>
          ) : null}
        </div>
      </header>
      <ResponsiveNavigation items={mobileNavItems} sidebarItems={desktopNavItems} />
    </>
  );
}
