import type { ReactNode } from "react";
import { LeagueIcon, type LeagueIconName } from "@/components/ui/LeagueIcon";

type EmptyStateKind = "discussions" | "timeline" | "bookmarks" | "notifications" | "achievements" | "search" | "default";

const emptyStateMeta: Record<EmptyStateKind, { icon: LeagueIconName; eyebrow: string }> = {
  discussions: { icon: "dailyDiscussions", eyebrow: "DISCUSSION ROOM" },
  timeline: { icon: "timeline", eyebrow: "ACTIVITY FEED" },
  bookmarks: { icon: "bookmarks", eyebrow: "SAVED INTEL" },
  notifications: { icon: "notifications", eyebrow: "SIGNALS" },
  achievements: { icon: "achievements", eyebrow: "ACHIEVEMENTS" },
  search: { icon: "search", eyebrow: "SEARCH INDEX" },
  default: { icon: "weeklyLeague", eyebrow: "LOGIC LEAGUE" },
};

export function EmptyState({ title, children, kind = "default", action }: { title: string; children: ReactNode; kind?: EmptyStateKind; action?: ReactNode }) {
  const meta = emptyStateMeta[kind];
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-dashed border-amber-300/20 bg-[radial-gradient(circle_at_top,rgba(215,180,106,0.12),transparent_32%),linear-gradient(145deg,rgba(255,255,255,0.055),rgba(8,13,26,0.78))] p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_80px_rgba(0,0,0,0.22)] sm:p-8">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-200/60 to-transparent" />
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.6rem] border border-amber-300/30 bg-black/30 text-league-gold shadow-glow">
        <div className="absolute inset-2 rounded-[1.2rem] border border-white/10" />
        <LeagueIcon name={meta.icon} size={34} />
      </div>
      <p className="text-[0.65rem] font-black uppercase tracking-[0.28em] text-league-gold/80">{meta.eyebrow}</p>
      <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-league-silver">{children}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
