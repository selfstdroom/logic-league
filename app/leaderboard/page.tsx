import Link from "next/link";
import { RankBadge } from "@/components/rank/RankBadge";
import { PremiumAvatar } from "@/components/ui/PremiumAvatar";
import { RankProgress } from "@/components/rank/RankProgress";
import { RankShowcase } from "@/components/rank/RankShowcase";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { HeroPanel, PageShell, PremiumBadge, SectionHeader } from "@/components/ui/DesignSystem";
import { OnboardingHint } from "@/components/ui/OnboardingHint";
import { getSeasonInfo } from "@/lib/competitive";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/logic-league";

export const dynamic = "force-dynamic";

type LeaderProfile = Pick<Profile, "id" | "username" | "display_name" | "avatar_url" | "rank" | "rating"> & { archetype?: string | null };

export default async function LeaderboardPage() {
  const admin = createAdminClient();
  const season = getSeasonInfo();
  const [{ data: profiles }, { data: wins }] = await Promise.all([
    admin.from("profiles").select("id, username, display_name, avatar_url, rank, rating, archetype").neq("rank", "Official").order("rating", { ascending: false }).limit(100),
    admin.from("hall_of_fame").select("winner_user_id"),
  ]);
  const winCounts = new Map<string, number>();
  for (const win of wins ?? []) if (win.winner_user_id) winCounts.set(win.winner_user_id, (winCounts.get(win.winner_user_id) ?? 0) + 1);
  const rankingProfiles = (profiles ?? []) as LeaderProfile[];
  const hasSufficientRankingData = rankingProfiles.length >= 3;

  const podium = hasSufficientRankingData ? rankingProfiles.slice(0, 3) : [];
  const rest = hasSufficientRankingData ? rankingProfiles.slice(3) : [];

  return (
    <PageShell className="max-w-7xl">
      <OnboardingHint storageKey="logic-league:onboarding:leaderboard" title="Leaderboardの見方" className="mb-5">
        競技議論の成績やRatingによるランキングを確認できます。Rank Badge、勝利数、Rating推移を合わせて見ましょう。
      </OnboardingHint>
      <HeroPanel eyebrow="Leaderboard" title="Global Ranking" className="lg:grid lg:grid-cols-[1fr_0.55fr] lg:items-end lg:gap-8">
        <div>
          現在のSeasonは<PremiumBadge tone="gold" className="mx-2">{season.label}</PremiumBadge>です。Rating順にLogic League全体の順位を表示します。上位者のRank Badgeと戦績がひと目で伝わるランキングです。
        </div>
      </HeroPanel>

      <RankShowcase title="全Rankの進行" className="mt-6" />

      {hasSufficientRankingData ? (
        <section className="mt-6 lg:mt-10">
          <SectionHeader eyebrow="Podium" title="上位ランカー" />
          <div className="grid gap-4 lg:grid-cols-3 lg:items-end">
            {podium.map((profile, index) => {
              const rankLabel = index + 1;
              const podiumClass = index === 0 ? "lg:order-2 border-amber-300/35 bg-amber-300/10 lg:scale-[1.04]" : index === 1 ? "lg:order-1 border-slate-200/25 bg-white/[0.06]" : "lg:order-3 border-orange-300/25 bg-orange-400/10";
              return (
                <Card key={profile.id} className={`text-center ${podiumClass}`}>
                  <p className="text-xs font-black uppercase tracking-[0.26em] text-league-gold">Rank #{rankLabel}</p>
                  <div className="mt-4 flex flex-col items-center gap-3"><PremiumAvatar avatarUrl={profile.avatar_url} displayName={profile.display_name} username={profile.username} rank={profile.rank} size="large" /><RankBadge rank={profile.rank} size={index === 0 ? "lg" : "md"} showLabel labelPlacement="bottom" /></div>
                  <Link href={`/profile/${profile.username}`} className="mt-4 block text-2xl font-black text-white hover:text-league-gold">{profile.display_name ?? profile.username}</Link>
                  <p className="mt-1 text-sm font-bold text-league-muted">@{profile.username}</p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3"><p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-league-muted">Rating</p><p className="mt-1 text-2xl font-black text-white">{profile.rating}</p></div>
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3"><p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-league-muted">Wins</p><p className="mt-1 text-2xl font-black text-white">{winCounts.get(profile.id) ?? 0}</p></div>
                  </div>
                  <div className="mt-4"><RankProgress rating={profile.rating} compact /></div>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mt-6 lg:mt-10">
        <SectionHeader eyebrow="Global" title="総合Leaderboard" />
        <Card className="overflow-hidden p-0">
          {hasSufficientRankingData ? (
            <div className="divide-y divide-white/10">
              {rest.map((profile, index) => {
                const position = index + 4;
                return (
                  <div key={profile.id} className="grid gap-3 px-4 py-4 transition hover:bg-white/[0.035] md:grid-cols-[4rem_1.6fr_1fr_0.8fr_0.8fr] md:items-center md:px-5">
                    <span className="text-2xl font-black text-league-gold">#{position}</span>
                    <Link href={`/profile/${profile.username}`} className="flex min-w-0 items-center gap-3 font-black text-white hover:text-league-gold">
                      <PremiumAvatar avatarUrl={profile.avatar_url} displayName={profile.display_name} username={profile.username} rank={profile.rank} size="small" />
                      <span className="min-w-0"><span className="block truncate text-lg">{profile.display_name ?? profile.username}</span><span className="block truncate text-xs font-bold text-league-muted">@{profile.username}</span></span>
                    </Link>
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 md:block md:border-0 md:bg-transparent md:p-0"><span className="text-xs font-black uppercase tracking-[0.18em] text-league-muted md:hidden">Rank</span><RankBadge rank={profile.rank} size="sm" showLabel /></div>
                    <span className="font-black text-white"><span className="mr-2 text-xs font-black uppercase tracking-[0.18em] text-league-muted md:hidden">Rating</span>{profile.rating}</span>
                    <span className="font-black text-white"><span className="mr-2 text-xs font-black uppercase tracking-[0.18em] text-league-muted md:hidden">勝利数</span>{winCounts.get(profile.id) ?? 0}</span>
                    <div className="md:col-start-2 md:col-span-4"><RankProgress rating={profile.rating} compact /></div>
                  </div>
                );
              })}
            </div>
          ) : (
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
