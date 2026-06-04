"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const visiblePrefixes = ["/home", "/timeline", "/search", "/profile"];

function shouldShow(pathname: string) {
  return visiblePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

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
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/65 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="participation-hub-title">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="閉じる" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-[#080b13] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.65)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">Participate in Discussion</p>
                <h2 id="participation-hub-title" className="mt-2 text-2xl font-black text-white">議論に参加</h2>
                <p className="mt-2 text-sm leading-6 text-league-muted">読みたい議論へ、いつでも一タップで移動できます。</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm font-black text-league-silver transition hover:text-white">閉じる</button>
            </div>

            <div className="mt-5 grid gap-3">
              <Link onClick={() => setOpen(false)} href="/topics" className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 font-black text-white transition hover:border-amber-300/35 hover:bg-white/[0.075]">今日の議論を見る</Link>
              <Link onClick={() => setOpen(false)} href="/weekly" className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 font-black text-white transition hover:border-amber-300/35 hover:bg-white/[0.075]">競技議論を見る</Link>
              <Link onClick={() => setOpen(false)} href="/api/discussions/random" className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 font-black text-white transition hover:border-amber-300/35 hover:bg-white/[0.075]">ランダムな議論を見る</Link>
              <Link onClick={() => setOpen(false)} href="/search" className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 font-black text-white transition hover:border-amber-300/35 hover:bg-white/[0.075]">検索して探す</Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
