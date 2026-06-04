"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const visiblePrefixes = ["/home", "/timeline", "/search", "/profile"];

function shouldShow(pathname: string) {
  return visiblePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

const actions = [
  { href: "/topics", label: "今日の議論" },
  { href: "/weekly", label: "競技議論" },
  { href: "/api/discussions/random", label: "ランダム" },
  { href: "/search", label: "検索" },
];

export function FloatingParticipationHub() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (!shouldShow(pathname)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-[60] flex h-16 w-16 items-center justify-center rounded-full border border-amber-200/60 bg-[radial-gradient(circle_at_35%_25%,#fff7d6_0%,#d7b46a_38%,#9b6b1d_100%)] text-xs font-black leading-tight text-league-black shadow-[0_18px_55px_rgba(215,180,106,0.38)] transition hover:-translate-y-1 hover:shadow-[0_22px_70px_rgba(215,180,106,0.52)] focus:outline-none focus:ring-4 focus:ring-amber-200/35 md:bottom-7 md:right-7 md:h-20 md:w-20"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="議論に参加"
      >
        議論に<br />参加
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="participation-hub-title">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="閉じる" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg rounded-t-[2rem] border border-white/10 border-b-transparent bg-[#080b13]/95 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 text-center shadow-[0_-24px_80px_rgba(0,0,0,0.7)] sm:mb-4 sm:rounded-[2rem] sm:border-b-white/10 sm:px-6 sm:pb-6">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-league-silver transition hover:bg-white/[0.12] hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-200/35"
              aria-label="閉じる"
            >
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-league-gold">Participate</p>
            <h2 id="participation-hub-title" className="mt-2 text-2xl font-black text-white">議論に参加</h2>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  onClick={() => setOpen(false)}
                  href={action.href}
                  className="flex min-h-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-4 text-center text-base font-black text-white transition hover:-translate-y-0.5 hover:border-amber-300/35 hover:bg-white/[0.1] focus:outline-none focus:ring-2 focus:ring-amber-200/35"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
