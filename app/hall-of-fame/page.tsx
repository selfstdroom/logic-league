import Link from "next/link";
import { RankBadge } from "@/components/rank/RankBadge";
import { PremiumAvatar } from "@/components/ui/PremiumAvatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { HeroPanel, PageShell, SectionHeader } from "@/components/ui/DesignSystem";
import { OnboardingHint } from "@/components/ui/OnboardingHint";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPreview, formatDateTime } from "@/lib/topics/format";

export const dynamic = "force-dynamic";

type FameRow = {
  id: string;
  final_score: number | null;
  ai_total_score: number | null;
  vote_count: number | null;
  created_at: string;
  topics?: { title?: string | null; publish_at?: string | null } | { title?: string | null; publish_at?: string | null }[] | null;
  profiles?: { username?: string | null; display_name?: string | null; avatar_url?: string | null; rank?: string | null } | { username?: string | null; display_name?: string | null; avatar_url?: string | null; rank?: string | null }[] | null;
  topic_answers?: { content?: string | null } | { content?: string | null }[] | null;
};
function first<T>(value: T | T[] | null | undefined) { return Array.isArray(value) ? value[0] : value; }

export default async function HallOfFamePage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("hall_of_fame")
    .select("id, final_score, ai_total_score, vote_count, created_at, topics(title, publish_at), profiles:profiles!hall_of_fame_winner_user_id_fkey(username, display_name, avatar_url, rank), topic_answers:topic_answers!hall_of_fame_winner_answer_id_fkey(content)")
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as FameRow[];

  return (
    <PageShell className="max-w-7xl">
      <OnboardingHint storageKey="logic-league:onboarding:hall-of-fame" title="Hall of Fameとは" className="mb-5">
        優れた回答が保存される殿堂です。勝者の回答、評価、議題を振り返り、強い思考の型を学べます。
      </OnboardingHint>
      <HeroPanel eyebrow="Hall of Fame" title="Weekly League勝者の殿堂">
        各Weekly Leagueの1位回答を保存し、勝者・Rank・最終スコア・回答Previewを公開します。
      </HeroPanel>
      <section className="mt-6 lg:mt-10">
        <SectionHeader eyebrow="Winners" title="歴代勝者" />
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((row) => {
            const topic = first(row.topics);
            const profile = first(row.profiles);
            const answer = first(row.topic_answers);
            return (
              <Link key={row.id} href={`/hall-of-fame/${row.id}`} className="block">
                <Card className="h-full border-amber-300/25 bg-[radial-gradient(circle_at_top_right,rgba(255,215,128,0.18),transparent_34%),linear-gradient(145deg,rgba(215,180,106,0.16),rgba(255,255,255,0.045))] p-0 transition hover:-translate-y-1 hover:border-amber-300/55">
                  <div className="relative overflow-hidden p-4 sm:p-6">
                    <div className="pointer-events-none absolute right-5 top-5 rounded-full border border-amber-200/25 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.24em] text-amber-100/70">Champion</div>
                    <p className="text-xs font-black uppercase tracking-[0.26em] text-league-gold">Week · {formatDateTime(topic?.publish_at ?? row.created_at)}</p>
                    <h2 className="mt-3 pr-16 text-xl font-black leading-tight text-white sm:pr-20 sm:text-3xl">{topic?.title ?? "Weekly League"}</h2>
                    <div className="mt-6 rounded-[1.5rem] border border-amber-300/25 bg-black/25 p-4">
                      <div className="flex items-center gap-3">
                        <PremiumAvatar avatarUrl={profile?.avatar_url} displayName={profile?.display_name} username={profile?.username} rank={profile?.rank} size="medium" />
                        <RankBadge rank={profile?.rank} size="medium" />
                        <div className="min-w-0"><p className="truncate text-lg font-black text-white">{profile?.display_name ?? profile?.username ?? "Winner"}</p><p className="text-sm text-league-muted">@{profile?.username ?? "unknown"}</p></div>
                        <div className="ml-auto text-right"><p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-league-muted">Final</p><p className="text-3xl font-black text-league-gold">{row.final_score ?? "—"}</p></div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs sm:mt-5 sm:gap-3 sm:text-sm">
                      <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3"><p className="font-black text-white">{row.final_score ?? "—"}</p><p className="text-xs text-league-muted">Final Score</p></div>
                      <div className="rounded-2xl border border-white/10 bg-black/25 p-3"><p className="font-black text-white">{row.ai_total_score ?? "—"}</p><p className="text-xs text-league-muted">AI Score</p></div>
                      <div className="rounded-2xl border border-white/10 bg-black/25 p-3"><p className="font-black text-white">{row.vote_count ?? 0}</p><p className="text-xs text-league-muted">得票</p></div>
                    </div>
                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-[0.62rem] font-black uppercase tracking-[0.24em] text-league-gold">Winning Answer Preview</p>
                      <p className="mt-2 text-sm leading-7 text-league-silver">{createPreview(answer?.content ?? "", 180)}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
        {rows.length === 0 ? (
          <EmptyState kind="achievements" title="最初のHall of Fame獲得者を目指しましょう">
            Hall of Fameは、Weekly Leagueなどの競技議論で高評価を獲得した勝者を保存する殿堂です。回答、AI評価、投票結果がそろうと、実際の勝者だけがここに掲載されます。
          </EmptyState>
        ) : null}
      </section>
    </PageShell>
  );
}
