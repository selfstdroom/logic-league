import Link from "next/link";
import { notFound } from "next/navigation";
import { AnswerForm, CommentForm, LikeButton } from "@/components/topics/TopicForms";
import { RankBadge } from "@/components/rank/RankBadge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { HeroPanel, PageShell, SectionHeader } from "@/components/ui/DesignSystem";
import { formatAnswerType, formatDateTime, formatTopicCategory } from "@/lib/topics/format";
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

  return (
    <PageShell>
      <HeroPanel eyebrow={formatTopicCategory(topic.category)} title={topic.title}>
        <time className="block text-sm text-league-muted">{formatDateTime(topic.publish_at)}</time>
        <div className="mt-6 whitespace-pre-wrap rounded-[1.5rem] border border-white/10 bg-black/25 p-5 leading-8 text-league-silver sm:p-6">{topic.content}</div>
      </HeroPanel>

      <section className="mt-8">
        <AnswerForm topicId={topic.id} canAnswer={Boolean(user && currentProfile?.qualified)} />
      </section>

      <section className="mt-10">
        <SectionHeader eyebrow="議論" title="みんなの回答" action={<p className="rounded-full border border-white/10 px-4 py-2 text-sm text-league-muted">{answerViews.length}件の回答</p>} />

        <div className="space-y-5">
          {answerViews.map((answer) => (
            <Card key={answer.id} className="group hover:-translate-y-1 hover:border-amber-300/35 hover:bg-white/[0.06]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <Link href={profileHref(answer.profile, answer.user_id)} className="flex items-center gap-3 rounded-xl transition hover:text-league-gold">
                  <RankBadge rank={answer.profile?.rank} size="sm" />
                  <span>
                    <span className="block font-black text-white">{displayName(answer.profile)}</span>
                    <span className="mt-1 block text-xs text-league-muted">@{answer.profile?.username ?? answer.user_id} · {formatDateTime(answer.created_at)}</span>
                  </span>
                </Link>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-league-silver">{formatAnswerType(answer.answer_type)}</span>
                  <LikeButton answerId={answer.id} likeCount={answer.likeCount} liked={answer.likedByCurrentUser} canLike={Boolean(user)} />
                </div>
              </div>
              <p className="mt-5 whitespace-pre-wrap rounded-[1.25rem] border border-white/10 bg-black/20 p-5 leading-7 text-league-silver">{answer.content}</p>

              <div className="mt-6 border-t border-white/10 pt-5">
                <h3 className="text-xs font-black uppercase tracking-[0.24em] text-league-muted">コメント</h3>
                <div className="mt-4 space-y-3">
                  {answer.comments.map((comment) => (
                    <div key={comment.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <Link href={profileHref(comment.profile, comment.user_id)} className="inline-flex items-center gap-2 text-sm font-bold text-white transition hover:text-league-gold">
                        <RankBadge rank={comment.profile?.rank} size="sm" />
                        <span>{displayName(comment.profile)}</span>
                        <span className="font-normal text-league-muted">@{comment.profile?.username ?? comment.user_id} · {formatDateTime(comment.created_at)}</span>
                      </Link>
                      <p className="mt-2 text-sm leading-6 text-league-silver">{comment.content}</p>
                    </div>
                  ))}
                  {answer.comments.length === 0 ? <p className="text-sm text-league-muted">まだコメントはありません。質の高い問いや補足が届くと、ここに蓄積されます。</p> : null}
                </div>
                <CommentForm answerId={answer.id} canComment={Boolean(user)} />
              </div>
            </Card>
          ))}
        </div>

        {answerViews.length === 0 ? <EmptyState title="まだ回答はありません。">まだ回答はありません。最初の回答を投稿しましょう。</EmptyState> : null}
      </section>
    </PageShell>
  );
}
