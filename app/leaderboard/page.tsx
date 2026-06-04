import Link from "next/link";
import { RankBadge } from "@/components/rank/RankBadge";
import { RankProgress } from "@/components/rank/RankProgress";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { HeroPanel, PageShell, PremiumBadge, SectionHeader } from "@/components/ui/DesignSystem";
import { getSeasonInfo } from "@/lib/competitive";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/logic-league";

export const dynamic = "force-dynamic";

type LeaderProfile = Pick<Profile, "id" | "username" | "display_name" | "rank" | "rating"> & { archetype?: string | null };

export default async function LeaderboardPage() {
  const admin = createAdminClient();
  const season = getSeasonInfo();
  const [{ data: profiles }, { data: wins }] = await Promise.all([
    admin.from("profiles").select("id, username, display_name, rank, rating, archetype").order("rating", { ascending: false }).limit(100),
    admin.from("hall_of_fame").select("winner_user_id"),
  ]);
  const winCounts = new Map<string, number>();
  for (const win of wins ?? []) if (win.winner_user_id) winCounts.set(win.winner_user_id, (winCounts.get(win.winner_user_id) ?? 0) + 1);
  const rankingProfiles = (profiles ?? []) as LeaderProfile[];
  const hasSufficientRankingData = rankingProfiles.length >= 3;

  return (
    <PageShell className="max-w-7xl">
      <HeroPanel eyebrow="Leaderboard" title="Global Ranking">
        現在のSeasonは<PremiumBadge tone="gold" className="mx-2">{season.label}</PremiumBadge>です。Rating順にLogic League全体の順位を表示します。上位3名は特別表示されます。
      </HeroPanel>
      <section className="mt-10">
        <SectionHeader eyebrow="Global" title="総合Leaderboard" />
        <Card className="overflow-hidden p-0">
          <div className="hidden grid-cols-[4rem_1.5fr_1fr_1fr_1fr] gap-3 border-b border-white/10 px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-league-muted md:grid">
            <span>順位</span><span>ユーザー</span><span>Rank</span><span>Rating</span><span>勝利数</span>
          </div>
          {hasSufficientRankingData ? rankingProfiles.map((profile, index) => {
            const topThreeClass = index === 0 ? "border-amber-300/35 bg-amber-300/10" : index === 1 ? "border-slate-200/25 bg-white/[0.07]" : index === 2 ? "border-orange-300/25 bg-orange-400/10" : "";
            return (
            <div key={profile.id} className={`grid grid-cols-[3rem_1fr] items-center gap-3 border-b border-white/10 px-4 py-4 last:border-b-0 md:grid-cols-[4rem_1.5fr_1fr_1fr_1fr] md:px-5 ${topThreeClass}`}>
              <span className="text-2xl font-black text-league-gold">#{index + 1}</span>
              <Link href={`/profile/${profile.username}`} className="min-w-0 font-black text-white hover:text-league-gold">
                <span className="block truncate">{profile.display_name ?? profile.username}</span>
                <span className="block truncate text-xs font-bold text-league-muted">@{profile.username}</span>
              </Link>
              <div className="col-span-full flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 md:col-span-1 md:block md:border-0 md:bg-transparent md:p-0"><span className="text-xs font-black uppercase tracking-[0.18em] text-league-muted md:hidden">Rank</span><RankBadge rank={profile.rank} size="xs" showLabel /></div>
              <span className="font-black text-white"><span className="mr-2 text-xs font-black uppercase tracking-[0.18em] text-league-muted md:hidden">Rating</span>{profile.rating}</span>
              <span className="font-black text-white"><span className="mr-2 text-xs font-black uppercase tracking-[0.18em] text-league-muted md:hidden">勝利数</span>{winCounts.get(profile.id) ?? 0}</span>
              <div className="col-span-full md:col-start-2 md:col-span-4">
                <RankProgress rating={profile.rating} compact />
              </div>
            </div>
          );}) : (
            <div className="p-5 sm:p-6">
              <EmptyState kind="achievements" title="ランキングは参加者が増えると表示されます">
                Ratingは認定試験で現在地を記録し、Competitive Discussionの結果で更新されます。十分な実参加者が集まるまでは順位を作らず、実データだけを表示します。
              </EmptyState>
            </div>
          )}
        </Card>
      </section>
    </PageShell>
  );
}
