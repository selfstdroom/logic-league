import { notFound } from "next/navigation";
import { AnswerForm, CommentForm, LikeButton } from "@/components/topics/TopicForms";
import { Card } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/topics/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/logic-league";
import type { Comment, Like, TopicAnswer } from "@/types/database";

type CommentWithProfile = Comment & { profile?: Pick<Profile, "display_name" | "username"> };
type AnswerView = TopicAnswer & {
  profile?: Pick<Profile, "display_name" | "username">;
  comments: CommentWithProfile[];
  likeCount: number;
  likedByCurrentUser: boolean;
};

function displayName(profile?: Pick<Profile, "display_name" | "username">) {
  return profile?.display_name || profile?.username || "Logic Player";
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
    ? await profileClient.from("profiles").select("id, display_name, username").in("id", Array.from(userIds))
    : { data: [] as Pick<Profile, "id" | "display_name" | "username">[] };

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

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl sm:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-league-gold">{topic.category}</span>
          <time className="text-sm text-league-muted">{formatDateTime(topic.publish_at)}</time>
        </div>
        <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">{topic.title}</h1>
        <div className="mt-8 whitespace-pre-wrap leading-8 text-league-silver">{topic.content}</div>
      </article>

      <section className="mt-8">
        <AnswerForm topicId={topic.id} canAnswer={Boolean(user && currentProfile?.qualified)} />
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-league-gold">Discussion</p>
            <h2 className="mt-2 text-3xl font-black">Existing Answers</h2>
          </div>
          <p className="text-sm text-league-muted">{answerViews.length} answers</p>
        </div>

        <div className="space-y-6">
          {answerViews.map((answer) => (
            <Card key={answer.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">{answer.answer_type ?? "Answer"}</span>
                  <span className="ml-3 text-sm text-league-muted">by {displayName(answer.profile)} · {formatDateTime(answer.created_at)}</span>
                </div>
                <LikeButton answerId={answer.id} likeCount={answer.likeCount} liked={answer.likedByCurrentUser} canLike={Boolean(user)} />
              </div>
              <p className="mt-5 whitespace-pre-wrap leading-7 text-league-silver">{answer.content}</p>

              <div className="mt-6 border-t border-white/10 pt-5">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-league-muted">Comments</h3>
                <div className="mt-4 space-y-3">
                  {answer.comments.map((comment) => (
                    <div key={comment.id} className="rounded-2xl bg-black/25 p-4">
                      <p className="text-sm font-bold text-white">{displayName(comment.profile)} <span className="font-normal text-league-muted">· {formatDateTime(comment.created_at)}</span></p>
                      <p className="mt-2 text-sm leading-6 text-league-silver">{comment.content}</p>
                    </div>
                  ))}
                  {answer.comments.length === 0 ? <p className="text-sm text-league-muted">コメントはまだありません。</p> : null}
                </div>
                <CommentForm answerId={answer.id} canComment={Boolean(user)} />
              </div>
            </Card>
          ))}
        </div>

        {answerViews.length === 0 ? <Card className="text-league-silver">まだ回答はありません。最初の回答を投稿しましょう。</Card> : null}
      </section>
    </main>
  );
}
