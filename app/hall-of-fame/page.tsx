import Link from "next/link";
import { RankBadge } from "@/components/rank/RankBadge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { HeroPanel, PageShell, SectionHeader } from "@/components/ui/DesignSystem";
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
  profiles?: { username?: string | null; display_name?: string | null; rank?: string | null } | { username?: string | null; display_name?: string | null; rank?: string | null }[] | null;
  topic_answers?: { content?: string | null } | { content?: string | null }[] | null;
};
function first<T>(value: T | T[] | null | undefined) { return Array.isArray(value) ? value[0] : value; }

export default async function HallOfFamePage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("hall_of_fame")
    .select("id, final_score, ai_total_score, vote_count, created_at, topics(title, publish_at), profiles:profiles!hall_of_fame_winner_user_id_fkey(username, display_name, rank), topic_answers:topic_answers!hall_of_fame_winner_answer_id_fkey(content)")
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as FameRow[];

  return (
    <PageShell className="max-w-7xl">
      <HeroPanel eyebrow="Hall of Fame" title="Weekly League勝者の殿堂">
        各Weekly Leagueの1位回答を保存し、勝者・Rank・最終スコア・回答Previewを公開します。
      </HeroPanel>
      <section className="mt-10">
        <SectionHeader eyebrow="Winners" title="歴代勝者" />
        <div className="grid gap-5 lg:grid-cols-2">
          {rows.map((row) => {
            const topic = first(row.topics);
            const profile = first(row.profiles);
            const answer = first(row.topic_answers);
            return (
              <Link key={row.id} href={`/hall-of-fame/${row.id}`} className="block">
                <Card className="h-full border-amber-300/20 bg-[linear-gradient(145deg,rgba(215,180,106,0.12),rgba(255,255,255,0.04))] transition hover:-translate-y-1 hover:border-amber-300/45">
                  <p className="text-xs font-black uppercase tracking-[0.26em] text-league-gold">Week · {formatDateTime(topic?.publish_at ?? row.created_at)}</p>
                  <h2 className="mt-3 text-2xl font-black text-white">{topic?.title ?? "Weekly League"}</h2>
                  <div className="mt-5 flex items-center gap-3">
                    <RankBadge rank={profile?.rank} size="sm" />
                    <div><p className="font-black text-white">{profile?.display_name ?? profile?.username ?? "Winner"}</p><p className="text-sm text-league-muted">@{profile?.username ?? "unknown"}</p></div>
                    <p className="ml-auto text-2xl font-black text-league-gold">{row.final_score ?? "—"}</p>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3"><p className="font-black text-white">{row.final_score ?? "—"}</p><p className="text-xs text-league-muted">Final Score</p></div>
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3"><p className="font-black text-white">{row.ai_total_score ?? "—"}</p><p className="text-xs text-league-muted">AI Score</p></div>
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3"><p className="font-black text-white">{row.vote_count ?? 0}</p><p className="text-xs text-league-muted">得票</p></div>
                  </div>
                  <p className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-7 text-league-silver">{createPreview(answer?.content ?? "", 180)}</p>
                </Card>
              </Link>
            );
          })}
        </div>
        {rows.length === 0 ? <EmptyState title="Hall of Fameはまだありません。">完了したWeekly Leagueの勝者がここに保存されます。</EmptyState> : null}
      </section>
    </PageShell>
  );
}
