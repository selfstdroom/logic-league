import Link from "next/link";
import { RankBadge } from "@/components/rank/RankBadge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { HeroPanel, PageShell } from "@/components/ui/DesignSystem";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createPreview, formatDateTime } from "@/lib/topics/format";
import type { Comment, Like, TopicAnswer } from "@/types/database";
import type { Profile } from "@/types/logic-league";

export const dynamic = "force-dynamic";

type TopicLite = {
  id?: string | null;
  type?: string | null;
  category?: string | null;
  title?: string | null;
  status?: string | null;
  reveal_at?: string | null;
};

type AnswerRow = Pick<TopicAnswer, "id" | "topic_id" | "user_id" | "answer_type" | "content" | "created_at"> & {
  topics?: TopicLite | TopicLite[] | null;
};

type CommentRow = Pick<Comment, "id" | "topic_answer_id" | "user_id" | "content" | "created_at"> & {
  topic_answers?: ({ id?: string | null; topic_id?: string | null; topics?: TopicLite | TopicLite[] | null }) | ({ id?: string | null; topic_id?: string | null; topics?: TopicLite | TopicLite[] | null })[] | null;
};

type TimelineItem = {
  id: string;
  kind: "answer" | "comment";
  topicId: string;
  answerId: string;
  userId: string;
  answerType: TopicAnswer["answer_type"] | null;
  content: string;
  createdAt: string;
  topic: TopicLite;
  profile?: Pick<Profile, "id" | "display_name" | "username" | "rank">;
  likeCount: number;
  commentCount: number;
};

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function displayName(profile?: Pick<Profile, "display_name" | "username">) {
  return profile?.display_name || profile?.username || "Logic Player";
}

function profileHref(profile: Pick<Profile, "id" | "username"> | undefined, userId: string) {
  return profile?.username ? `/profile/${profile.username}` : `/profile/${profile?.id ?? userId}`;
}

function topicHref(item: TimelineItem) {
  return item.topic.type === "weekly" ? `/weekly/${item.topicId}` : `/topics/${item.topicId}`;
}

function activityLabel(item: TimelineItem) {
  if (item.kind === "comment") return "コメントしました";
  switch (item.answerType) {
    case "Counter":
      return "反論しました";
    case "Support":
      return "賛成・補足しました";
    case "Question":
      return "質問しました";
    default:
      return "回答しました";
  }
}

export default async function TimelinePage() {
  const supabase = await createClient();
  const readClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;
  const now = new Date().toISOString();

  const [{ data: dailyAnswers }, { data: weeklyAnswers }, { data: comments }] = await Promise.all([
    readClient
      .from("topic_answers")
      .select("id, topic_id, user_id, answer_type, content, created_at, topics!inner(id, type, category, title, status)")
      .eq("topics.type", "daily")
      .eq("topics.status", "published")
      .order("created_at", { ascending: false })
      .limit(24),
    readClient
      .from("topic_answers")
      .select("id, topic_id, user_id, answer_type, content, created_at, topics!inner(id, type, category, title, status, reveal_at)")
      .eq("topics.type", "weekly")
      .eq("topics.status", "published")
      .lte("topics.reveal_at", now)
      .order("created_at", { ascending: false })
      .limit(12),
    readClient
      .from("comments")
      .select("id, topic_answer_id, user_id, content, created_at, topic_answers!inner(id, topic_id, topics!inner(id, type, category, title, status))")
      .eq("topic_answers.topics.type", "daily")
      .eq("topic_answers.topics.status", "published")
      .order("created_at", { ascending: false })
      .limit(24),
  ]);

  const answerRows = ([...((dailyAnswers ?? []) as AnswerRow[]), ...((weeklyAnswers ?? []) as AnswerRow[])]);
  const commentRows = (comments ?? []) as CommentRow[];
  const answerIds = Array.from(new Set([
    ...answerRows.map((answer) => answer.id),
    ...commentRows.map((comment) => first(comment.topic_answers)?.id).filter((id): id is string => Boolean(id)),
  ]));

  const [{ data: likes }, { data: answerComments }] = await Promise.all([
    answerIds.length > 0 ? readClient.from("likes").select("topic_answer_id").in("topic_answer_id", answerIds) : Promise.resolve({ data: [] as Pick<Like, "topic_answer_id">[] }),
    answerIds.length > 0 ? readClient.from("comments").select("topic_answer_id").in("topic_answer_id", answerIds) : Promise.resolve({ data: [] as Pick<Comment, "topic_answer_id">[] }),
  ]);

  const likeCounts = new Map<string, number>();
  for (const like of likes ?? []) likeCounts.set(like.topic_answer_id, (likeCounts.get(like.topic_answer_id) ?? 0) + 1);
  const commentCounts = new Map<string, number>();
  for (const comment of answerComments ?? []) commentCounts.set(comment.topic_answer_id, (commentCounts.get(comment.topic_answer_id) ?? 0) + 1);

  const userIds = Array.from(new Set([
    ...answerRows.map((answer) => answer.user_id),
    ...commentRows.map((comment) => comment.user_id),
  ]));
  const { data: profiles } = userIds.length > 0
    ? await readClient.from("profiles").select("id, display_name, username, rank").in("id", userIds)
    : { data: [] as Pick<Profile, "id" | "display_name" | "username" | "rank">[] };
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const answerItems: TimelineItem[] = answerRows.map((answer) => ({
    id: `answer-${answer.id}`,
    kind: "answer",
    topicId: answer.topic_id,
    answerId: answer.id,
    userId: answer.user_id,
    answerType: answer.answer_type,
    content: answer.content,
    createdAt: answer.created_at,
    topic: first(answer.topics) ?? {},
    profile: profilesById.get(answer.user_id),
    likeCount: likeCounts.get(answer.id) ?? 0,
    commentCount: commentCounts.get(answer.id) ?? 0,
  }));

  const commentItems: TimelineItem[] = commentRows.map((comment) => {
    const answer = first(comment.topic_answers);
    const topic = first(answer?.topics);
    const answerId = answer?.id ?? comment.topic_answer_id;
    return {
      id: `comment-${comment.id}`,
      kind: "comment",
      topicId: answer?.topic_id ?? topic?.id ?? "",
      answerId,
      userId: comment.user_id,
      answerType: null,
      content: comment.content,
      createdAt: comment.created_at,
      topic: topic ?? {},
      profile: profilesById.get(comment.user_id),
      likeCount: likeCounts.get(answerId) ?? 0,
      commentCount: commentCounts.get(answerId) ?? 0,
    };
  });

  const items = [...answerItems, ...commentItems]
    .filter((item) => item.topicId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 36);

  return (
    <PageShell>
      <HeroPanel eyebrow="Public Timeline" title="知的な議論が今まさに動いている場所" actions={<>
        <Link href="/topics" className="rounded-full border border-amber-300/30 bg-amber-300/10 px-5 py-3 text-sm font-black text-league-gold transition hover:bg-amber-300/20 hover:text-white">Topicsを見る</Link>
        <Link href="/login" className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:border-amber-300/30">ログインする</Link>
      </>}>
        Recent Daily Topic answers, comments, and revealed Weekly League answers are visible to everyone. 参加アクションにはログインが必要です。
      </HeroPanel>

      <section className="mt-8 space-y-5">
        {items.map((item) => (
          <Card key={item.id} className="hover:-translate-y-1 hover:border-amber-300/35 hover:bg-white/[0.06]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <Link href={profileHref(item.profile, item.userId)} className="flex min-w-0 items-center gap-3 rounded-xl transition hover:text-league-gold">
                <RankBadge rank={item.profile?.rank} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate font-black text-white">{displayName(item.profile)}</span>
                  <span className="block truncate text-xs text-league-muted">@{item.profile?.username ?? item.userId} · Rank {item.profile?.rank ?? "—"}</span>
                </span>
              </Link>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-league-silver">
                <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-league-gold">{activityLabel(item)}</span>
                <time className="rounded-full border border-white/10 px-3 py-1">{formatDateTime(item.createdAt)}</time>
              </div>
            </div>

            <Link href={topicHref(item)} className="mt-5 block rounded-[1.25rem] border border-white/10 bg-black/20 p-5 transition hover:border-amber-300/35">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-league-gold">{item.topic.category ?? "Topic"}</span>
                {item.topic.type === "weekly" ? <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-league-silver">Weekly League</span> : null}
              </div>
              <h2 className="mt-3 text-xl font-black leading-snug text-white">{item.topic.title ?? "Topic"}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-league-silver">{createPreview(item.content, 220)}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-league-muted">
                <span>いいね {item.likeCount}</span>
                <span>コメント {item.commentCount}</span>
                <span>Topic detail →</span>
              </div>
            </Link>
          </Card>
        ))}
      </section>

      {items.length === 0 ? <EmptyState title="まだタイムラインはありません。">回答やコメントが投稿されると、ここに公開タイムラインとして表示されます。</EmptyState> : null}
    </PageShell>
  );
}
