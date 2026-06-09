"use client";

import { useEffect, useState } from "react";

type OnboardingHintProps = {
  storageKey: string;
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function OnboardingHint({ storageKey, title, children, className = "" }: OnboardingHintProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(storageKey) !== "dismissed");
    } catch {
      setVisible(true);
    }
  }, [storageKey]);

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey, "dismissed");
    } catch {
      // localStorage may be unavailable in private browsing; closing still works for this session.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <section className={`animate-[onboardingSlideUp_420ms_ease-out] rounded-[1.35rem] border border-amber-300/22 bg-[radial-gradient(circle_at_top_left,rgba(215,180,106,0.16),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.075),rgba(7,12,23,0.7))] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.26)] sm:p-5 ${className}`} aria-label="ページガイド">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-league-gold">First guide</p>
          <h2 className="mt-1 text-lg font-black leading-tight text-white sm:text-xl">{title}</h2>
          <div className="mt-2 text-sm font-bold leading-7 text-league-silver">{children}</div>
        </div>
        <button type="button" onClick={dismiss} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-black text-league-silver transition hover:border-amber-300/35 hover:bg-white/[0.08] hover:text-white">
          閉じる
        </button>
      </div>
    </section>
  );
}
