import Link from "next/link";
import { RankBadge } from "@/components/rank/RankBadge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPreview, formatDateTime } from "@/lib/topics/format";
import { getRankByRating } from "@/lib/rank";
import { buildAiScoreSummary, finalizeWeeklyLeague } from "@/lib/weekly";
import { calculateWeeklyDeviation, formatDeviation } from "@/lib/thinkingDeviation";
import type { Profile } from "@/types/logic-league";

export const dynamic = "force-dynamic";

type RatingHistoryRow = { user_id: string; old_rating: number | null; new_rating: number | null; delta: number | null };
type DeviationHistoryRow = { user_id: string; topic_answer_id: string | null; deviation: number; created_at: string };

type ResultAnswer = {
  id: string;
  user_id: string;
  content: string;
  ai_structure_score: number | null;
  ai_logic_score: number | null;
  ai_originality_score: number | null;
  ai_feasibility_score: number | null;
  ai_risk_score: number | null;
  ai_total_score: number | null;
  vote_count: number;
  final_score: number | null;
  ranking_position: number | null;
};

function displayName(profile?: Pick<Profile, "display_name" | "username">) {
  return profile?.display_name || profile?.username || "Logic Leagueユーザー";
}

export default async function WeeklyResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: topic } = await admin.from("topics").select("*").eq("id", id).eq("type", "weekly").eq("status", "published").maybeSingle();
  if (!topic) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-6">
        <Card className="border-red-300/20 bg-red-950/20">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-red-200">競技議論結果</p>
          <h1 className="mt-3 text-4xl font-black">競技議論が見つかりません。</h1>
          <p className="mt-4 text-league-silver">指定された議論は存在しないか、公開されていません。</p>
          <ButtonLink href="/weekly" className="mt-6">競技議論に戻る</ButtonLink>
        </Card>
      </main>
    );
  }

  if (!topic.vote_deadline_at || new Date(topic.vote_deadline_at).getTime() > Date.now()) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-6">
        <Card>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">結果は未公開</p>
          <h1 className="mt-3 text-4xl font-black">結果は投票終了後に公開されます。</h1>
          <p className="mt-4 text-league-silver">投票締切: {formatDateTime(topic.vote_deadline_at)}</p>
          <Link href={`/weekly/${topic.id}`} className="mt-6 inline-block text-sm font-bold text-league-gold hover:text-white">← 議論に戻る</Link>
        </Card>
      </main>
    );
  }

  await finalizeWeeklyLeague(topic.id);

  const { data: answers } = await admin
    .from("topic_answers")
    .select("id, user_id, content, ai_structure_score, ai_logic_score, ai_originality_score, ai_feasibility_score, ai_risk_score, ai_total_score, vote_count, final_score, ranking_position")
    .eq("topic_id", id)
    .order("ranking_position", { ascending: true, nullsFirst: false });

  const rows = (answers ?? []) as ResultAnswer[];
  const userIds = Array.from(new Set(rows.map((answer) => answer.user_id)));
  const [{ data: profiles }, { data: ratingHistories }, { data: deviationHistories }] = userIds.length > 0
    ? await Promise.all([
      admin.from("profiles").select("id, display_name, username, rank, rating, qualified").in("id", userIds),
      admin.from("rating_histories").select("user_id, old_rating, new_rating, delta").eq("topic_id", id).eq("reason", "weekly_result").in("user_id", userIds),
      admin.from("thinking_deviation_histories").select("user_id, topic_answer_id, deviation, created_at").eq("source_type", "weekly").in("user_id", userIds).order("created_at", { ascending: false }),
    ])
    : [{ data: [] as Pick<Profile, "id" | "display_name" | "username" | "rank" | "rating" | "qualified">[] }, { data: [] as RatingHistoryRow[] }, { data: [] as DeviationHistoryRow[] }];
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const ratingHistoryByUserId = new Map(((ratingHistories ?? []) as RatingHistoryRow[]).map((history) => [history.user_id, history]));
  const deviationRows = (deviationHistories ?? []) as DeviationHistoryRow[];
  const previousDeviationByAnswerId = new Map<string, number | null>();
  const isHighestWeeklyByAnswerId = new Map<string, boolean>();
  for (const answer of rows) {
    const current = deviationRows.find((row) => row.topic_answer_id === answer.id)?.deviation ?? calculateWeeklyDeviation(answer.final_score);
    const previous = deviationRows.find((row) => row.user_id === answer.user_id && row.topic_answer_id !== answer.id)?.deviation ?? null;
    const highest = Math.max(current, ...deviationRows.filter((row) => row.user_id === answer.user_id).map((row) => Number(row.deviation)));
    previousDeviationByAnswerId.set(answer.id, previous);
    isHighestWeeklyByAnswerId.set(answer.id, current >= highest);
  }
  const topAnswers = rows.slice(0, 3);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:py-12">
      <div className="relative overflow-hidden rounded-[2rem] border border-amber-300/20 bg-[radial-gradient(circle_at_top_right,rgba(215,180,106,0.2),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.07),rgba(8,13,26,0.78))] p-6 shadow-2xl sm:p-10">
        <p className="text-xs font-black uppercase tracking-[0.34em] text-league-gold">競技議論結果</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">{topic.title}</h1>
        <p className="mt-5 text-league-silver">最終スコア = AIスコア × 70% + 正規化した得票スコア × 30%。結果確定後、順位に応じてRatingが加算され、RankとHall of Fameが更新されます。</p>
      </div>

      <section className="mt-10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">Top Answers</p>
            <h2 className="mt-2 text-3xl font-black">上位回答</h2>
          </div>
          <ButtonLink href={`/weekly/${topic.id}`} className="bg-none bg-white/10 text-white shadow-none ring-1 ring-white/15">議論に戻る</ButtonLink>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {topAnswers.map((answer) => {
            const profile = profilesById.get(answer.user_id);
            const currentDeviation = calculateWeeklyDeviation(answer.final_score);
            const previousDeviation = previousDeviationByAnswerId.get(answer.id);
            const deviationDiff = previousDeviation == null ? null : Number((currentDeviation - previousDeviation).toFixed(1));
            const isNewBest = isHighestWeeklyByAnswerId.get(answer.id);
            return (
              <Card key={answer.id} className="border-amber-300/20 bg-[linear-gradient(145deg,rgba(215,180,106,0.1),rgba(255,255,255,0.04))]">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-league-gold">#{answer.ranking_position ?? "-"}</p>
                <div className="mt-3 flex items-center gap-3">
                  <RankBadge rank={profile?.rank} size="xs" />
                  <div className="min-w-0">
                    <p className="truncate font-black text-white">{displayName(profile)}</p>
                    <p className="truncate text-sm text-league-muted">@{profile?.username ?? "unknown"} · {profile?.rank ?? "Rank"} · Rating {profile?.rating ?? "—"}</p>
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-7 text-league-silver">{answer.content}</p>
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-league-silver">
                  <p className="font-bold text-white">AIスコア内訳</p>
                  <p className="mt-2 leading-6">{buildAiScoreSummary(answer)}</p>
                </div>
                <div className="mt-4 rounded-2xl border border-amber-300/25 bg-black/25 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-league-gold">今回のWeekly思考偏差値</p>
                  <p className="mt-2 text-2xl font-black text-white">AI推定思考偏差値：{formatDeviation(currentDeviation)}</p>
                  <p className={`mt-1 text-sm font-black ${deviationDiff == null ? "text-league-muted" : deviationDiff >= 0 ? "text-emerald-200" : "text-red-200"}`}>前回比: {deviationDiff == null ? "—" : `${deviationDiff >= 0 ? "+" : ""}${deviationDiff.toFixed(1)}`}</p>
                  {isNewBest ? <p className="mt-2 inline-flex rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-100">最高記録更新</p> : null}
                  <p className="mt-3 text-xs leading-5 text-league-muted">本結果はAIによる推定であり、正式なIQ検査・心理検査ではありません。</p>
                </div>
              </Card>
            );
          })}
        </div>
        {topAnswers.length === 0 ? <EmptyState kind="discussions" title="上位回答はまだありません。">この競技議論では確定した投稿がありません。</EmptyState> : null}
      </section>

      <section className="mt-10 space-y-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">Ranking</p>
          <h2 className="mt-2 text-3xl font-black">最終Ranking</h2>
        </div>
        {rows.map((answer) => {
          const profile = profilesById.get(answer.user_id);
          const history = ratingHistoryByUserId.get(answer.user_id);
          const oldRank = history?.old_rating == null ? null : getRankByRating(history.old_rating, profile?.qualified ?? true);
          const newRank = profile?.rank ?? (history?.new_rating == null ? null : getRankByRating(history.new_rating, profile?.qualified ?? true));
          const promoted = oldRank && newRank && oldRank !== newRank;
          const currentDeviation = calculateWeeklyDeviation(answer.final_score);
          const previousDeviation = previousDeviationByAnswerId.get(answer.id);
          const deviationDiff = previousDeviation == null ? null : Number((currentDeviation - previousDeviation).toFixed(1));
          const isNewBest = isHighestWeeklyByAnswerId.get(answer.id);
          return (
            <Card key={answer.id} className="hover:border-amber-300/35 hover:bg-white/[0.06]">
              <div className="grid gap-4 md:grid-cols-[0.45fr_1.25fr_0.75fr_0.75fr_0.65fr_0.9fr] md:items-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-league-muted">順位</p>
                  <p className="mt-1 text-4xl font-black text-league-gold">#{answer.ranking_position ?? "-"}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-white">{displayName(profile)}</p>
                  <p className="truncate text-sm text-league-muted">@{profile?.username ?? "unknown"} · {profile?.rank ?? "Rank"} · Rating {profile?.rating ?? "—"}</p>
                  <p className="mt-2 text-sm leading-6 text-league-silver">{createPreview(answer.content, 120)}</p>
                </div>
                <div><p className="text-xs uppercase tracking-[0.18em] text-league-muted">最終スコア</p><p className="mt-1 text-2xl font-black">{answer.final_score ?? 0}</p></div>
                <div><p className="text-xs uppercase tracking-[0.18em] text-league-muted">AIスコア</p><p className="mt-1 text-2xl font-black">{answer.ai_total_score ?? 0}</p></div>
                <div><p className="text-xs uppercase tracking-[0.18em] text-league-muted">得票数</p><p className="mt-1 text-2xl font-black">{answer.vote_count}</p></div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-league-muted">Rating変動</p>
                  <p className="mt-1 text-2xl font-black text-emerald-200">+{history?.delta ?? 0}</p>
                  {promoted ? <p className="mt-1 text-xs font-bold text-league-gold">昇格: {oldRank} → {newRank}</p> : <p className="mt-1 text-xs text-league-muted">現在Rank: {newRank ?? profile?.rank ?? "—"}</p>}
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-league-gold">今回のWeekly思考偏差値</p>
                <p className="mt-2 text-xl font-black text-white">AI推定思考偏差値：{formatDeviation(currentDeviation)}</p>
                <p className="mt-1 text-xs text-league-muted">前回比: {deviationDiff == null ? "—" : `${deviationDiff >= 0 ? "+" : ""}${deviationDiff.toFixed(1)}`} {isNewBest ? " · 最高記録更新" : ""}</p>
              </div>
              <details className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                <summary className="cursor-pointer text-sm font-bold text-league-gold">回答全文を見る</summary>
                <p className="mt-4 whitespace-pre-wrap leading-8 text-league-silver">{answer.content}</p>
              </details>
            </Card>
          );
        })}
      </section>
      {rows.length === 0 ? <EmptyState kind="discussions" title="結果はまだありません。">この競技議論では確定した投稿がありません。</EmptyState> : null}
      <Link href={`/weekly/${topic.id}`} className="mt-8 inline-block text-sm font-bold text-league-gold hover:text-white">← 議論に戻る</Link>
    </main>
  );
}
