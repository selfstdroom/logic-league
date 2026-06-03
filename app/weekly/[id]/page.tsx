import Link from "next/link";
import { notFound } from "next/navigation";
import { WeeklySubmissionForm, WeeklyVoteButton } from "@/components/weekly/WeeklyForms";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/topics/format";
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
          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-league-gold">{topic.category}</span>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-bold text-league-silver">{getWeeklyStatusLabel(phase)}</span>
        </div>
        <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">{topic.title}</h1>
        <p className="mt-6 whitespace-pre-wrap rounded-[1.5rem] border border-white/10 bg-black/25 p-5 leading-8 text-league-silver">{topic.content}</p>
        <div className="mt-6 grid gap-3 text-sm text-league-silver md:grid-cols-3">
          <p className="rounded-2xl border border-white/10 bg-black/25 p-4"><span className="block text-xs uppercase tracking-[0.18em] text-league-muted">Submission deadline</span>{formatDateTime(topic.deadline_at)}</p>
          <p className="rounded-2xl border border-white/10 bg-black/25 p-4"><span className="block text-xs uppercase tracking-[0.18em] text-league-muted">Reveal date</span>{formatDateTime(topic.reveal_at)}</p>
          <p className="rounded-2xl border border-white/10 bg-black/25 p-4"><span className="block text-xs uppercase tracking-[0.18em] text-league-muted">Vote deadline</span>{formatDateTime(topic.vote_deadline_at)}</p>
        </div>
      </article>

      <Card className="mt-8">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">Rules</p>
        <div className="mt-4 grid gap-3 text-sm leading-6 text-league-silver md:grid-cols-2">
          <p className="rounded-2xl border border-white/10 bg-black/25 p-4">One Answer submission per qualified user. Edits are allowed only before the submission deadline.</p>
          <p className="rounded-2xl border border-white/10 bg-black/25 p-4">Reveal is anonymous: no username, rank, rating, archetype, or profile links are shown while voting is open.</p>
          <p className="rounded-2xl border border-white/10 bg-black/25 p-4">Qualified users may cast up to three votes before the vote deadline.</p>
          <p className="rounded-2xl border border-white/10 bg-black/25 p-4">Self-voting is blocked. Results unlock after voting closes.</p>
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
              <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">Anonymous Reveal</p>
              <h2 className="mt-2 text-3xl font-black">Vote for the strongest entries</h2>
            </div>
            <p className="rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-sm font-bold text-league-gold">Remaining votes: {remainingVotes}</p>
          </div>
          <div className="space-y-5">
            {(answers ?? []).map((answer, index) => (
              <Card key={answer.id} className="hover:border-amber-300/35 hover:bg-white/[0.06]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-league-gold">Anonymous Entry #{index + 1}</p>
                    <p className="mt-2 text-sm text-league-muted">{buildAiScoreSummary(answer)}</p>
                  </div>
                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    <p className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm text-league-silver">Votes: {answer.vote_count}</p>
                    <WeeklyVoteButton topicId={topic.id} answerId={answer.id} canVote={canVote && answer.user_id !== user?.id} voted={votedAnswerIds.has(answer.id)} />
                  </div>
                </div>
                <p className="mt-5 whitespace-pre-wrap rounded-[1.25rem] border border-white/10 bg-black/25 p-5 leading-7 text-league-silver">{answer.content}</p>
              </Card>
            ))}
          </div>
          {(answers ?? []).length === 0 ? <EmptyState title="No entries revealed yet.">Entries appear after submissions are received.</EmptyState> : null}
        </section>
      ) : null}

      {phase === "completed" ? (
        <Card className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">Results unlocked</p>
            <h2 className="mt-2 text-3xl font-black">Final ranking is available.</h2>
          </div>
          <ButtonLink href={`/weekly/${topic.id}/results`}>View Results</ButtonLink>
        </Card>
      ) : null}

      {phase !== "completed" ? <p className="mt-6 text-sm text-league-muted">Results page opens after {formatDateTime(topic.vote_deadline_at)}.</p> : null}
      <div className="mt-8"><Link href="/weekly" className="text-sm font-bold text-league-gold hover:text-white">← Back to Weekly League</Link></div>
    </main>
  );
}
