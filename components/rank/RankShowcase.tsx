import { RankBadge } from "@/components/rank/RankBadge";

const ranks = ["Challenger", "Analyst", "Strategist", "Architect", "Mastermind", "Oracle"] as const;

export function RankShowcase({ title = "Rank Progression", className = "" }: { title?: string; className?: string }) {
  return (
    <section className={`rounded-[1.75rem] border border-amber-300/18 bg-[radial-gradient(circle_at_top,rgba(215,180,106,0.12),transparent_52%),linear-gradient(145deg,rgba(255,255,255,0.055),rgba(7,12,23,0.78))] p-4 shadow-[0_22px_80px_rgba(0,0,0,0.28)] sm:p-6 ${className}`} aria-label="ランクバッジ一覧">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-league-gold">Rank System</p>
          <h2 className="mt-1 text-2xl font-black text-white">{title}</h2>
        </div>
        <p className="hidden max-w-xs text-right text-sm leading-6 text-league-silver sm:block">Ratingに応じて全6段階のRank Badgeがプロフィールとランキングに表示されます。</p>
      </div>
      <div className="mt-5 -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0 lg:pb-0">
        {ranks.map((rank, index) => (
          <div key={rank} className="relative flex min-w-[9.25rem] snap-center flex-col items-center rounded-[1.35rem] border border-white/10 bg-black/20 p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] lg:min-w-0">
            <RankBadge rank={rank} size="md" showLabel labelPlacement="bottom" />
            {index < ranks.length - 1 ? <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-league-gold/70 lg:block">→</span> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
