import { PageShell } from "@/components/ui/DesignSystem";
import { ThoughtFeed, type ThoughtFeedItem } from "@/components/thoughts/ThoughtFeed";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Comment, Like, TopicAnswer } from "@/types/database";
import type { Profile } from "@/types/logic-league";

export const dynamic = "force-dynamic";

type ProfileLite = Pick<Profile, "id" | "display_name" | "username" | "rank">;
type TopicLite = { id?: string | null; type?: string | null; category?: string | null; title?: string | null; status?: string | null; reveal_at?: string | null };
type AnswerRow = Pick<TopicAnswer, "id" | "topic_id" | "user_id" | "answer_type" | "content" | "created_at"> & { topics?: TopicLite | TopicLite[] | null };

type ThoughtType = ThoughtFeedItem["type"];

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function displayName(profile?: Pick<Profile, "display_name" | "username">) {
  return profile?.display_name || profile?.username || "Logic Leagueユーザー";
}

function profileHref(profile: Pick<Profile, "username"> | undefined) {
  return profile?.username ? `/profile/${profile.username}` : "/profile";
}

function answerThoughtType(answerType: TopicAnswer["answer_type"]): ThoughtType {
  switch (answerType) {
    case "Counter":
      return "COUNTER";
    case "Support":
      return "SUPPORT";
    case "Question":
      return "QUESTION";
    default:
      return "ANSWER";
  }
}

function discussionHref(topic: TopicLite, answer: AnswerRow) {
  return topic.type === "weekly" ? `/weekly/${answer.topic_id}` : `/topics/${answer.topic_id}#answer-${answer.id}`;
}

function thoughtScore(item: ThoughtFeedItem) {
  const ageHours = Math.max(1, (Date.now() - new Date(item.createdAt).getTime()) / 36e5);
  const recency = 120 / ageHours;
  const engagement = item.likeCount * 4 + item.commentCount * 3;
  const competitiveBoost = item.discussionType === "weekly" ? 10 : 0;
  return recency + engagement + competitiveBoost;
}

export default async function TimelinePage() {
  const supabase = await createClient();
  const readClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;
  const now = new Date().toISOString();

  const { data: answers } = await readClient
    .from("topic_answers")
    .select("id, topic_id, user_id, answer_type, content, created_at, topics!inner(id, type, category, title, status, reveal_at)")
    .eq("topics.status", "published")
    .filter("topics.type", "in", "(daily,weekly,special)")
    .order("created_at", { ascending: false })
    .limit(96);

  const answerRows = ((answers ?? []) as AnswerRow[]).filter((answer) => {
    const topic = first(answer.topics);
    return topic?.type !== "weekly" || !topic.reveal_at || topic.reveal_at <= now;
  });
  const answerIds = answerRows.map((answer) => answer.id);

  const [{ data: likes }, { data: comments }] = await Promise.all([
    answerIds.length > 0 ? readClient.from("likes").select("topic_answer_id").in("topic_answer_id", answerIds) : Promise.resolve({ data: [] as Pick<Like, "topic_answer_id">[] }),
    answerIds.length > 0 ? readClient.from("comments").select("topic_answer_id").in("topic_answer_id", answerIds) : Promise.resolve({ data: [] as Pick<Comment, "topic_answer_id">[] }),
  ]);

  const likeCounts = new Map<string, number>();
  for (const like of likes ?? []) likeCounts.set(like.topic_answer_id, (likeCounts.get(like.topic_answer_id) ?? 0) + 1);
  const commentCounts = new Map<string, number>();
  for (const comment of comments ?? []) commentCounts.set(comment.topic_answer_id, (commentCounts.get(comment.topic_answer_id) ?? 0) + 1);

  const userIds = Array.from(new Set(answerRows.map((answer) => answer.user_id)));
  const { data: profiles } = userIds.length > 0
    ? await readClient.from("profiles").select("id, display_name, username, rank").in("id", userIds)
    : { data: [] as ProfileLite[] };
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const items: ThoughtFeedItem[] = answerRows.map((answer) => {
    const topic = first(answer.topics) ?? {};
    const profile = profilesById.get(answer.user_id);
    return {
      id: `thought-${answer.id}`,
      type: answerThoughtType(answer.answer_type),
      topicId: answer.topic_id,
      answerId: answer.id,
      href: discussionHref(topic, answer),
      discussionTitle: topic.title ?? "議論",
      discussionType: topic.type,
      content: answer.content,
      createdAt: answer.created_at,
      likeCount: likeCounts.get(answer.id) ?? 0,
      commentCount: commentCounts.get(answer.id) ?? 0,
      author: {
        id: answer.user_id,
        displayName: displayName(profile),
        username: profile?.username,
        rank: profile?.rank,
        href: profileHref(profile),
      },
    };
  }).sort((a, b) => thoughtScore(b) - thoughtScore(a) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <PageShell className="max-w-2xl pb-32">
      <header className="sticky top-0 z-10 -mx-4 border-b border-white/10 bg-league-black/88 px-4 py-3 backdrop-blur sm:-mx-5 sm:px-5">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">Thought Feed</p>
        <h1 className="mt-1 text-xl font-black text-white">思考フィード</h1>
        <p className="mt-1 text-sm font-bold text-league-muted">回答・反論・賛成補足・質問だけを流します。主役はユーザーではなく、議論に投げ込まれたアイデアです。</p>
      </header>

      <ThoughtFeed items={items} />
    </PageShell>
  );
}
