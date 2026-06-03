import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AnswerHistory, type AnswerHistoryItem } from "@/components/profile/AnswerHistory";
import { RankBadge } from "@/components/rank/RankBadge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { createPreview, formatDateTime } from "@/lib/topics/format";
import type { TopicAnswerType } from "@/types/database";

type TopicAnswerHistoryRow = {
  id: string;
  topic_id: string;
  answer_type: TopicAnswerType | null;
  content: string;
  created_at: string;
  topics: { category?: string | null; title?: string | null } | { category?: string | null; title?: string | null }[] | null;
};

type CountRow = { topic_answer_id: string };

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
  if (!profile) notFound();

  const isOwnProfile = user.id === profile.id;
  const profileClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? (await import("@/lib/supabase/admin")).createAdminClient() : supabase;

  const [{ count: dailyAnswerCount }, { data: recentAnswers }, { data: examAnswers }, { data: topicAnswers }] = await Promise.all([
    supabase
      .from("topic_answers")
      .select("id, topics!inner(type)", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("topics.type", "daily"),
    supabase
      .from("topic_answers")
      .select("id, topic_id, answer_type, content, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5),
    profileClient
      .from("exam_answers")
      .select("id, answer, created_at, predicted_deviation, archetype, total_score, structure_score, hypothesis_score, originality_score, feasibility_score, risk_score, summary, strength, weakness, upper_gap")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("topic_answers")
      .select("id, topic_id, answer_type, content, created_at, topics!inner(id, type, category, title)")
      .eq("user_id", profile.id)
      .eq("topics.type", "daily")
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  const topicAnswerRows = (topicAnswers ?? []) as TopicAnswerHistoryRow[];
  const topicAnswerIds = topicAnswerRows.map((answer) => answer.id);
  const [{ data: likes }, { data: comments }] = await Promise.all([
    topicAnswerIds.length > 0 ? supabase.from("likes").select("topic_answer_id").in("topic_answer_id", topicAnswerIds) : Promise.resolve({ data: [] as CountRow[] }),
    topicAnswerIds.length > 0 ? supabase.from("comments").select("topic_answer_id").in("topic_answer_id", topicAnswerIds) : Promise.resolve({ data: [] as CountRow[] }),
  ]);
  const likeRows = (likes ?? []) as CountRow[];
  const commentRows = (comments ?? []) as CountRow[];

  const likeCounts = new Map<string, number>();
  for (const like of likeRows) likeCounts.set(like.topic_answer_id, (likeCounts.get(like.topic_answer_id) ?? 0) + 1);
  const commentCounts = new Map<string, number>();
  for (const comment of commentRows) commentCounts.set(comment.topic_answer_id, (commentCounts.get(comment.topic_answer_id) ?? 0) + 1);

  const historyItems: AnswerHistoryItem[] = [
    ...((examAnswers ?? []).map((answer) => ({ ...answer, kind: "exam" as const }))),
    ...topicAnswerRows.map((answer) => {
      const topic = Array.isArray(answer.topics) ? answer.topics[0] : answer.topics;
      return {
        kind: "topic" as const,
        id: answer.id,
        topic_id: answer.topic_id,
        created_at: answer.created_at,
        answer_type: answer.answer_type,
        content: answer.content,
        category: topic?.category ?? "Topic",
        title: topic?.title ?? "Daily Topic",
        likeCount: likeCounts.get(answer.id) ?? 0,
        commentCount: commentCounts.get(answer.id) ?? 0,
      };
    }),
  ];

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:py-12">
      <Card className="p-0">
        <div className="relative overflow-hidden p-6 sm:p-10">
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-[2rem] border border-amber-300/35 bg-gradient-to-br from-league-gold via-white to-slate-500 text-4xl font-black text-black shadow-[0_0_60px_rgba(215,180,106,0.2)]">
                {profile.display_name?.[0] ?? profile.username[0]}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">プロフィール</p>
                <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">{profile.display_name ?? profile.username}</h1>
                <p className="mt-2 text-league-muted">@{profile.username}</p>
                <p className="mt-4 max-w-2xl text-league-silver">{profile.bio ?? "まだbioはありません。"}</p>
              </div>
            </div>
            <RankBadge rank={profile.rank} size="lg" showLabel />
          </div>

          <div className="relative mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4"><span className="block text-xs uppercase tracking-[0.22em] text-league-muted">Rating</span><span className="mt-2 block text-3xl font-black text-white">{profile.rating}</span></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><span className="block text-xs uppercase tracking-[0.22em] text-league-muted">推定思考偏差値</span><span className="mt-2 block text-3xl font-black">{profile.predicted_deviation ?? "未受験"}</span></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><span className="block text-xs uppercase tracking-[0.22em] text-league-muted">Daily Topic回答</span><span className="mt-2 block text-3xl font-black">{dailyAnswerCount ?? 0}</span></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><span className="block text-xs uppercase tracking-[0.22em] text-league-muted">認定状態</span><span className="mt-2 block text-3xl font-black">{profile.qualified ? "認定済み" : "未認定"}</span></div>
          </div>
        </div>
      </Card>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">思考アーキタイプ</p>
          <h2 className="mt-3 text-3xl font-black">{profile.archetype ?? "未分類"}</h2>
          <p className="mt-4 text-sm leading-6 text-league-silver">認定試験から推定された思考傾向です。論点の組み立て方、リスクの見方、反論への備え方を把握するための指標です。</p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-2xl font-black">0</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-league-muted">勝利</p></div>
            <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-2xl font-black">0</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-league-muted">Top 10</p></div>
            <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-2xl font-black">0</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-league-muted">Hall</p></div>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">Activity</p>
          <h2 className="mt-3 text-3xl font-black">最近の投稿</h2>
          <div className="mt-6 space-y-4">
            {(recentAnswers ?? []).map((answer) => (
              <Link key={answer.id} href={`/topics/${answer.topic_id}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-amber-300/35 hover:bg-white/[0.06]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-league-silver">{answer.answer_type ?? "Answer"}</span>
                  <time className="text-xs text-league-muted">{formatDateTime(answer.created_at)}</time>
                </div>
                <p className="mt-3 text-sm leading-6 text-league-silver">{createPreview(answer.content, 150)}</p>
              </Link>
            ))}
          </div>
          {(recentAnswers ?? []).length === 0 ? <EmptyState title="まだ投稿はありません。">回答が投稿されると、ここにアクティビティが表示されます。</EmptyState> : null}
        </Card>
      </section>

      <AnswerHistory items={historyItems} isOwnProfile={isOwnProfile} />
    </main>
  );
}
