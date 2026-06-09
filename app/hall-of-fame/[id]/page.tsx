import { notFound } from "next/navigation";
import { RankBadge } from "@/components/rank/RankBadge";
import { Card } from "@/components/ui/Card";
import { HeroPanel, PageShell, SectionHeader, StatCard } from "@/components/ui/DesignSystem";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildAiScoreSummary } from "@/lib/weekly";

export const dynamic = "force-dynamic";

type FameDetail = {
  id: string;
  final_score: number | null;
  ai_total_score: number | null;
  vote_count: number | null;
  topics?: { title?: string | null; content?: string | null } | { title?: string | null; content?: string | null }[] | null;
  profiles?: { username?: string | null; display_name?: string | null; rank?: string | null } | { username?: string | null; display_name?: string | null; rank?: string | null }[] | null;
  topic_answers?: {
    content?: string | null;
    ai_structure_score?: number | null;
    ai_logic_score?: number | null;
    ai_originality_score?: number | null;
    ai_feasibility_score?: number | null;
    ai_risk_score?: number | null;
    ai_total_score?: number | null;
    vote_count?: number | null;
  } | {
    content?: string | null;
    ai_structure_score?: number | null;
    ai_logic_score?: number | null;
    ai_originality_score?: number | null;
    ai_feasibility_score?: number | null;
    ai_risk_score?: number | null;
    ai_total_score?: number | null;
    vote_count?: number | null;
  }[] | null;
};
function first<T>(value: T | T[] | null | undefined) { return Array.isArray(value) ? value[0] : value; }

export default async function HallOfFameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data } = await admin
    .from("hall_of_fame")
    .select("id, final_score, ai_total_score, vote_count, topics(title, content), profiles:profiles!hall_of_fame_winner_user_id_fkey(username, display_name, rank), topic_answers:topic_answers!hall_of_fame_winner_answer_id_fkey(content, ai_structure_score, ai_logic_score, ai_originality_score, ai_feasibility_score, ai_risk_score, ai_total_score, vote_count)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const row = data as FameDetail;
  const topic = first(row.topics);
  const profile = first(row.profiles);
  const answer = first(row.topic_answers);

  return (
    <PageShell>
      <HeroPanel eyebrow="Hall of Fame" title={topic?.title ?? "勝利回答"}>
        <div className="flex items-center gap-3">
          <RankBadge rank={profile?.rank} size="medium" />
          <span className="font-black text-white">{profile?.display_name ?? profile?.username ?? "Winner"}</span>
          <span className="text-league-muted">@{profile?.username ?? "unknown"}</span>
        </div>
      </HeroPanel>
      <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <SectionHeader eyebrow="Winning Answer" title="勝利回答" />
          <p className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/25 p-5 leading-8 text-league-silver">{answer?.content ?? "回答本文はありません。"}</p>
        </Card>
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <StatCard label="Final score" value={row.final_score ?? "—"} tone="gold" />
            <StatCard label="AI score" value={row.ai_total_score ?? "—"} />
            <StatCard label="Votes" value={row.vote_count ?? 0} />
          </div>
          <Card>
            <SectionHeader eyebrow="Score Breakdown" title="内訳" />
            <p className="text-sm leading-7 text-league-silver">{answer ? buildAiScoreSummary({
              ai_total_score: answer.ai_total_score ?? null,
              ai_structure_score: answer.ai_structure_score ?? null,
              ai_logic_score: answer.ai_logic_score ?? null,
              ai_originality_score: answer.ai_originality_score ?? null,
              ai_feasibility_score: answer.ai_feasibility_score ?? null,
              ai_risk_score: answer.ai_risk_score ?? null,
            }) : "AIスコアはありません。"}</p>
          </Card>
          <Card>
            <SectionHeader eyebrow="AI Summary" title="評価要約" />
            <p className="text-sm leading-7 text-league-silver">この回答は、AI評価と投票評価を統合した最終スコアでWeekly Leagueの頂点に立ちました。構造・論理・独創性・実現可能性・リスク認識の総合力が、Hall of Fameに保存されています。</p>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}
