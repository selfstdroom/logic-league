import Link from "next/link";
import { notFound } from "next/navigation";
import { WeeklySubmissionForm, WeeklyVoteButton } from "@/components/weekly/WeeklyForms";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatTopicCategory } from "@/lib/topics/format";
import { buildAiScoreSummary, getWeeklyPhase, getWeeklyStatusLabel } from "@/lib/weekly";
import type { TopicAnswer, WeeklyVote } from "@/types/database";

export default async function WeeklyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: topic }, { data: currentProfile }] = await Promise.all([
    supabase.from("topics").select("*").eq("id", id).eq("type", "weekly").eq("status", "published").maybeSingle(),
    user ? supabase.from("profiles").select("qualified").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  if (!topic) notFound();

  const phase = getWeeklyPhase(topic);
  const [{ data: answers }, { data: votes }, { data: ownSubmission }] = await Promise.all([
    phase === "voting" || phase === "completed"
      ? supabase.from("topic_answers").select("*").eq("topic_id", id).order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as TopicAnswer[] }),
    user ? supabase.from("weekly_votes").select("*").eq("topic_id", id).eq("user_id", user.id) : Promise.resolve({ data: [] as WeeklyVote[] }),
    user ? supabase.from("topic_answers").select("*").eq("topic_id", id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const usedVotes = votes?.length ?? 0;
  const remainingVotes = Math.max(0, 3 - usedVotes);
  const votedAnswerIds = new Set((votes ?? []).map((vote) => vote.topic_answer_id));
  const canSubmit = Boolean(user && currentProfile?.qualified && phase === "submission");
  const canVote = Boolean(user && currentProfile?.qualified && phase === "voting" && remainingVotes > 0);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:py-12">
      <article className="relative overflow-hidden rounded-[2rem] border border-amber-300/20 bg-[radial-gradient(circle_at_top_right,rgba(215,180,106,0.2),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.07),rgba(8,13,26,0.78))] p-6 shadow-2xl sm:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-league-gold">{formatTopicCategory(topic.category)}</span>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-bold text-league-silver">{getWeeklyStatusLabel(phase)}</span>
        </div>
        <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">{topic.title}</h1>
        <p className="mt-6 whitespace-pre-wrap rounded-[1.5rem] border border-white/10 bg-black/25 p-5 leading-8 text-league-silver">{topic.content}</p>
        <div className="mt-6 grid gap-3 text-sm text-league-silver md:grid-cols-3">
          <p className="rounded-2xl border border-white/10 bg-black/25 p-4"><span className="block text-xs uppercase tracking-[0.18em] text-league-muted">投稿締切</span>{formatDateTime(topic.deadline_at)}</p>
          <p className="rounded-2xl border border-white/10 bg-black/25 p-4"><span className="block text-xs uppercase tracking-[0.18em] text-league-muted">公開日時</span>{formatDateTime(topic.reveal_at)}</p>
          <p className="rounded-2xl border border-white/10 bg-black/25 p-4"><span className="block text-xs uppercase tracking-[0.18em] text-league-muted">投票締切</span>{formatDateTime(topic.vote_deadline_at)}</p>
        </div>
      </article>

      <Card className="mt-8">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">ルール</p>
        <div className="mt-4 grid gap-3 text-sm leading-6 text-league-silver md:grid-cols-2">
          <p className="rounded-2xl border border-white/10 bg-black/25 p-4">認定済みユーザーは1つのTopicにつき1件だけ投稿できます。編集できるのは投稿締切までです。</p>
          <p className="rounded-2xl border border-white/10 bg-black/25 p-4">匿名公開中は、ユーザー名、Rank、Rating、思考タイプ、プロフィールリンクは表示されません。</p>
          <p className="rounded-2xl border border-white/10 bg-black/25 p-4">認定済みユーザーは投票締切までに最大3票を投じられます。</p>
          <p className="rounded-2xl border border-white/10 bg-black/25 p-4">自分の投稿への投票はできません。結果は投票終了後に公開されます。</p>
        </div>
      </Card>

      {phase === "submission" ? (
        <section className="mt-8">
          <WeeklySubmissionForm topicId={topic.id} canSubmit={canSubmit} initialContent={ownSubmission?.content ?? ""} />
        </section>
      ) : null}

      {phase === "voting" ? (
        <section className="mt-10">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">匿名公開</p>
              <h2 className="mt-2 text-3xl font-black">最も強い投稿に投票する</h2>
            </div>
            <p className="rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-sm font-bold text-league-gold">残り投票数: {remainingVotes}</p>
          </div>
          <div className="space-y-5">
            {(answers ?? []).map((answer, index) => (
              <Card key={answer.id} className="hover:border-amber-300/35 hover:bg-white/[0.06]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-league-gold">匿名投稿 #{index + 1}</p>
                    <p className="mt-2 text-sm text-league-muted">{buildAiScoreSummary(answer)}</p>
                  </div>
                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    <p className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm text-league-silver">得票数: {answer.vote_count}</p>
                    <WeeklyVoteButton topicId={topic.id} answerId={answer.id} canVote={canVote && answer.user_id !== user?.id} voted={votedAnswerIds.has(answer.id)} />
                  </div>
                </div>
                <p className="mt-5 whitespace-pre-wrap rounded-[1.25rem] border border-white/10 bg-black/25 p-5 leading-7 text-league-silver">{answer.content}</p>
              </Card>
            ))}
          </div>
          {(answers ?? []).length === 0 ? <EmptyState title="公開された投稿はまだありません。">投稿が集まると、ここに表示されます。</EmptyState> : null}
        </section>
      ) : null}

      {phase === "completed" ? (
        <Card className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">結果公開中</p>
            <h2 className="mt-2 text-3xl font-black">最終Rankingを確認できます。</h2>
          </div>
          <ButtonLink href={`/weekly/${topic.id}/results`}>結果を見る</ButtonLink>
        </Card>
      ) : null}

      {phase !== "completed" ? <p className="mt-6 text-sm text-league-muted">結果ページは次の日時以降に開きます: {formatDateTime(topic.vote_deadline_at)}.</p> : null}
      <div className="mt-8"><Link href="/weekly" className="text-sm font-bold text-league-gold hover:text-white">← Weekly Leagueに戻る</Link></div>
    </main>
  );
}
