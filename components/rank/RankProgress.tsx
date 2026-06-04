import { getNextRank, getRankProgress } from "@/lib/rank";
import type { RankName } from "@/types/logic-league";

type RankProgressProps = {
  rank?: RankName | string | null;
  rating: number | null | undefined;
  qualified?: boolean | null;
  compact?: boolean;
  className?: string;
};

export function RankProgress({ rating, qualified = true, compact = false, className = "" }: RankProgressProps) {
  const safeRating = rating ?? 0;
  const nextRank = getNextRank(safeRating, qualified ?? true);
  const progress = getRankProgress(safeRating, qualified ?? true);
  const remaining = nextRank ? Math.max(0, nextRank.min - safeRating) : 0;

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3 text-xs font-bold text-league-silver">
        <span>Rating {safeRating}</span>
        {nextRank ? <span>{nextRank.name}まであと{remaining}pt</span> : <span>最高Rank到達</span>}
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-league-gold via-amber-200 to-white" style={{ width: `${progress}%` }} />
      </div>
      {!compact ? (
        <p className="mt-2 text-xs leading-5 text-league-muted">
          {nextRank ? `次のRankは${nextRank.name}です。Weekly Leagueで上位に入るとRatingが加算されます。` : "Oracleとして最高Rankに到達しています。Hall of Fameでさらなる名声を積み上げましょう。"}
        </p>
      ) : null}
    </div>
  );
}
