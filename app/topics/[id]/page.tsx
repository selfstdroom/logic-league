import Link from "next/link";
import { notFound } from "next/navigation";
import { AnswerForm, CommentForm, LikeButton } from "@/components/topics/TopicForms";
import { RankBadge } from "@/components/rank/RankBadge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { HeroPanel, PageShell, SectionHeader } from "@/components/ui/DesignSystem";
import { formatAnswerType, formatDateTime, formatDiscussionType, formatTopicCategory } from "@/lib/topics/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/logic-league";
import type { Comment, Like, TopicAnswer } from "@/types/database";

type CommentWithProfile = Comment & { profile?: Pick<Profile, "id" | "display_name" | "username" | "rank"> };
type AnswerView = TopicAnswer & {
  profile?: Pick<Profile, "id" | "display_name" | "username" | "rank">;
  comments: CommentWithProfile[];
  likeCount: number;
  likedByCurrentUser: boolean;
};

function displayName(profile?: Pick<Profile, "display_name" | "username">) {
  return profile?.display_name || profile?.username || "Logic Leagueユーザー";
}

function profileHref(profile: Pick<Profile, "id" | "username"> | undefined, userId: string) {
  return profile?.username ? `/profile/${profile.username}` : `/profile/${profile?.id ?? userId}`;
}

function AnswerCard({ answer, canInteract, idPrefix = "answer" }: { answer: AnswerView; canInteract: boolean; idPrefix?: string }) {
  return (
    <Card key={answer.id} id={`${idPrefix}-${answer.id}`} className="group hover:-translate-y-1 hover:border-amber-300/35 hover:bg-white/[0.06]">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-league-silver">{formatAnswerType(answer.answer_type)}</span>
        <LikeButton answerId={answer.id} likeCount={answer.likeCount} liked={answer.likedByCurrentUser} canLike={canInteract} />
        <span className="text-xs font-bold text-league-muted">{formatDateTime(answer.created_at)}</span>
      </div>

      <p className="mt-5 whitespace-pre-wrap rounded-[1.25rem] border border-white/10 bg-black/20 p-5 leading-7 text-league-silver">{answer.content}</p>

      <div className="mt-4 flex min-w-0 items-center gap-2 text-xs text-league-muted">
        <RankBadge rank={answer.profile?.rank} size="xs" />
        <Link href={profileHref(answer.profile, answer.user_id)} className="truncate font-black text-white transition hover:text-league-gold">{displayName(answer.profile)}</Link>
        <span className="truncate">@{answer.profile?.username ?? answer.user_id}</span>
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <h3 className="text-xs font-black uppercase tracking-[0.24em] text-league-muted">コメント</h3>
        <div className="mt-4 space-y-3">
          {answer.comments.map((comment) => (
            <div key={comment.id} id={`comment-${comment.id}`} className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-sm leading-6 text-league-silver">{comment.content}</p>
              <Link href={profileHref(comment.profile, comment.user_id)} className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-white transition hover:text-league-gold">
                <RankBadge rank={comment.profile?.rank} size="xs" />
                <span>{displayName(comment.profile)}</span>
                <span className="font-normal text-league-muted">@{comment.profile?.username ?? comment.user_id} · {formatDateTime(comment.created_at)}</span>
              </Link>
            </div>
          ))}
          {answer.comments.length === 0 ? <p className="text-sm text-league-muted">まだコメントはありません。</p> : null}
        </div>
        <CommentForm answerId={answer.id} canComment={canInteract} />
      </div>
    </Card>
  );
}

export default async function TopicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: topic }, { data: currentProfile }] = await Promise.all([
    supabase.from("topics").select("*").eq("id", id).eq("type", "daily").eq("status", "published").maybeSingle(),
    user ? supabase.from("profiles").select("qualified").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  if (!topic) notFound();

  const { data: answers } = await supabase
    .from("topic_answers")
    .select("*")
    .eq("topic_id", id)
    .order("created_at", { ascending: false });

  const answerRows = answers ?? [];
  const answerIds = answerRows.map((answer) => answer.id);
  const userIds = new Set(answerRows.map((answer) => answer.user_id));

  const [{ data: comments }, { data: likes }] = await Promise.all([
    answerIds.length > 0
      ? supabase.from("comments").select("*").in("topic_answer_id", answerIds).order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as Comment[] }),
    answerIds.length > 0
      ? supabase.from("likes").select("*").in("topic_answer_id", answerIds)
      : Promise.resolve({ data: [] as Like[] }),
  ]);

  for (const comment of comments ?? []) userIds.add(comment.user_id);

  const profileClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;
  const { data: profiles } = userIds.size > 0
    ? await profileClient.from("profiles").select("id, display_name, username, rank").in("id", Array.from(userIds))
    : { data: [] as Pick<Profile, "id" | "display_name" | "username" | "rank">[] };

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const commentsByAnswerId = new Map<string, CommentWithProfile[]>();
  for (const comment of comments ?? []) {
    const list = commentsByAnswerId.get(comment.topic_answer_id) ?? [];
    list.push({ ...comment, profile: profilesById.get(comment.user_id) });
    commentsByAnswerId.set(comment.topic_answer_id, list);
  }

  const likesByAnswerId = new Map<string, Like[]>();
  for (const like of likes ?? []) {
    const list = likesByAnswerId.get(like.topic_answer_id) ?? [];
    list.push(like);
    likesByAnswerId.set(like.topic_answer_id, list);
  }

  const answerViews: AnswerView[] = answerRows.map((answer) => {
    const answerLikes = likesByAnswerId.get(answer.id) ?? [];
    return {
      ...answer,
      profile: profilesById.get(answer.user_id),
      comments: commentsByAnswerId.get(answer.id) ?? [],
      likeCount: answerLikes.length,
      likedByCurrentUser: Boolean(user && answerLikes.some((like) => like.user_id === user.id)),
    };
  });
  const answersByType = {
    Answer: answerViews.filter((answer) => answer.answer_type === "Answer"),
    Counter: answerViews.filter((answer) => answer.answer_type === "Counter"),
    Support: answerViews.filter((answer) => answer.answer_type === "Support"),
    Question: answerViews.filter((answer) => answer.answer_type === "Question"),
  };
  const topAnswerIds = new Set([...answersByType.Answer].sort((a, b) => (b.likeCount + b.comments.length) - (a.likeCount + a.comments.length)).slice(0, 3).map((answer) => answer.id));

  const { data: relatedTopics } = await supabase
    .from("topics")
    .select("id, type, category, title, content, publish_at")
    .eq("type", "daily")
    .eq("status", "published")
    .eq("category", topic.category)
    .neq("id", topic.id)
    .order("publish_at", { ascending: false, nullsFirst: false })
    .limit(3);

  return (
    <PageShell>
      <HeroPanel eyebrow="Original Question" title={topic.title}>
        <div className="flex flex-wrap gap-2 text-sm text-league-muted"><time>{formatDateTime(topic.publish_at)}</time><span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-league-silver">{formatTopicCategory(topic.category)}</span></div>
        <div className="mt-6 whitespace-pre-wrap rounded-[1.5rem] border border-white/10 bg-black/25 p-5 leading-8 text-league-silver sm:p-6">{topic.content}</div>
      </HeroPanel>

      <section className="mt-8">
        <AnswerForm topicId={topic.id} canAnswer={Boolean(user && currentProfile?.qualified)} />
      </section>

      <section className="mt-10">
        <SectionHeader eyebrow="議論スレッド" title="回答・反論・補足・質問" action={<p className="rounded-full border border-white/10 px-4 py-2 text-sm text-league-muted">{answerViews.length}件の投稿</p>} />

        <div className="mb-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><p className="text-xs text-league-muted">回答</p><p className="mt-1 text-2xl font-black text-white">{answersByType.Answer.length}</p></div>
          <div className="rounded-2xl border border-red-300/20 bg-red-300/10 p-4"><p className="text-xs text-league-muted">反論</p><p className="mt-1 text-2xl font-black text-white">{answersByType.Counter.length}</p></div>
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4"><p className="text-xs text-league-muted">賛成・補足</p><p className="mt-1 text-2xl font-black text-white">{answersByType.Support.length}</p></div>
          <div className="rounded-2xl border border-purple-300/20 bg-purple-300/10 p-4"><p className="text-xs text-league-muted">質問</p><p className="mt-1 text-2xl font-black text-white">{answersByType.Question.length}</p></div>
        </div>

        <div className="space-y-10">
          <section>
            <SectionHeader eyebrow="Top Answers" title="Top Answers" action={<p className="rounded-full border border-white/10 px-4 py-2 text-sm text-league-muted">人気順</p>} />
            <div className="space-y-5">
              {[...answersByType.Answer].sort((a, b) => (b.likeCount + b.comments.length) - (a.likeCount + a.comments.length)).slice(0, 3).map((answer) => <AnswerCard key={`top-${answer.id}`} answer={answer} canInteract={Boolean(user)} />)}
              {answersByType.Answer.length === 0 ? <p className="text-sm text-league-muted">まだ回答はありません。</p> : null}
            </div>
          </section>

          <section>
            <SectionHeader eyebrow="New Answers" title="新着回答" />
            <div className="space-y-5">
              {[...answersByType.Answer].filter((answer) => !topAnswerIds.has(answer.id)).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5).map((answer) => <AnswerCard key={`new-${answer.id}`} answer={answer} canInteract={Boolean(user)} />)}
              {answersByType.Answer.filter((answer) => !topAnswerIds.has(answer.id)).length === 0 ? <p className="text-sm text-league-muted">新着回答はTop Answersに表示されています。</p> : null}
            </div>
          </section>

          <section>
            <SectionHeader eyebrow="Counterarguments" title="反論" />
            <div className="space-y-5">
              {answersByType.Counter.map((answer) => <AnswerCard key={`counter-${answer.id}`} answer={answer} canInteract={Boolean(user)} />)}
              {answersByType.Counter.length === 0 ? <p className="text-sm text-league-muted">まだ反論はありません。</p> : null}
            </div>
          </section>

          <section>
            <SectionHeader eyebrow="Support Arguments" title="賛成・補足" />
            <div className="space-y-5">
              {answersByType.Support.map((answer) => <AnswerCard key={`support-${answer.id}`} answer={answer} canInteract={Boolean(user)} />)}
              {answersByType.Support.length === 0 ? <p className="text-sm text-league-muted">まだ賛成・補足はありません。</p> : null}
            </div>
          </section>

          <section>
            <SectionHeader eyebrow="Comments" title="コメントが動いている回答" />
            <div className="space-y-5">
              {answerViews.filter((answer) => answer.comments.length > 0).slice(0, 3).map((answer) => <AnswerCard key={`comments-${answer.id}`} answer={answer} canInteract={Boolean(user)} idPrefix="comment-thread" />)}
              {answerViews.every((answer) => answer.comments.length === 0) ? <p className="text-sm text-league-muted">まだコメントはありません。</p> : null}
            </div>
          </section>
        </div>

        {answerViews.length === 0 ? <EmptyState kind="discussions" title="まだ回答はありません。">まだ回答はありません。最初の回答を投稿しましょう。</EmptyState> : null}
      </section>

      <section className="mt-10">
        <SectionHeader eyebrow="関連議論" title="同じテーマの議論を見る" />
        <div className="grid gap-4 md:grid-cols-3">
          {(relatedTopics ?? []).map((related) => (
            <Link key={related.id} href={`/topics/${related.id}`} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-1 hover:border-amber-300/35">
              <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-league-gold">{formatDiscussionType(related.type)}</span>
              <h3 className="mt-4 text-lg font-black leading-snug text-white">{related.title}</h3>
              <p className="mt-3 text-sm leading-6 text-league-muted">{formatDateTime(related.publish_at)}</p>
            </Link>
          ))}
        </div>
        {(relatedTopics ?? []).length === 0 ? <p className="text-sm text-league-muted">関連する議論はまだありません。</p> : null}
      </section>
    </PageShell>
  );
}
