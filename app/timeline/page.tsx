import { PageShell } from "@/components/ui/DesignSystem";
import { OnboardingHint } from "@/components/ui/OnboardingHint";
import { ThoughtFeed, type ThoughtFeedItem } from "@/components/thoughts/ThoughtFeed";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Comment, DebateReplyType, Like, TopicAnswer } from "@/types/database";
import type { Profile } from "@/types/logic-league";

export const dynamic = "force-dynamic";

type ProfileLite = Pick<Profile, "id" | "display_name" | "username" | "rank" | "avatar_url">;
type CurrentProfile = Pick<Profile, "qualified">;
type TopicLite = { id?: string | null; type?: string | null; category?: string | null; title?: string | null; status?: string | null; reveal_at?: string | null; is_sample?: boolean | null };
type AnswerRow = Pick<TopicAnswer, "id" | "topic_id" | "user_id" | "answer_type" | "content" | "created_at" | "is_sample"> & { topics?: TopicLite | TopicLite[] | null };
type ReplyRow = Pick<Comment, "id" | "topic_answer_id" | "parent_reply_id" | "user_id" | "reply_type" | "content" | "created_at" | "is_sample"> & {
  topic_answers?: ({ id?: string | null; topic_id?: string | null; topics?: TopicLite | TopicLite[] | null } | { id?: string | null; topic_id?: string | null; topics?: TopicLite | TopicLite[] | null }[]) | null;
};

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

function replyThoughtType(replyType: DebateReplyType): ThoughtType {
  switch (replyType) {
    case "counter":
      return "COUNTER";
    case "rebuttal":
      return "REBUTTAL";
    case "question":
      return "QUESTION";
    default:
      return "SUPPORT";
  }
}

function discussionHref(topic: TopicLite, answer: Pick<AnswerRow, "topic_id" | "id">) {
  return topic.type === "weekly" ? `/weekly/${answer.topic_id}` : `/topics/${answer.topic_id}#answer-${answer.id}`;
}

function replyHref(topic: TopicLite, topicId: string, replyId: string) {
  return topic.type === "weekly" ? `/weekly/${topicId}` : `/topics/${topicId}#reply-${replyId}`;
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
  const { data: { user } } = await supabase.auth.getUser();
  const now = new Date().toISOString();

  const [{ data: answers }, { data: replies }] = await Promise.all([
    readClient
      .from("topic_answers")
      .select("id, topic_id, user_id, answer_type, content, created_at, is_sample, topics!inner(id, type, category, title, status, reveal_at, is_sample)")
      .eq("topics.status", "published")
      .filter("topics.type", "in", "(daily,weekly,special)")
      .order("created_at", { ascending: false })
      .limit(96),
    readClient
      .from("comments")
      .select("id, topic_answer_id, parent_reply_id, user_id, reply_type, content, created_at, is_sample, topic_answers!inner(id, topic_id, topics!inner(id, type, category, title, status, reveal_at, is_sample))")
      .eq("topic_answers.topics.status", "published")
      .filter("topic_answers.topics.type", "in", "(daily,weekly,special)")
      .order("created_at", { ascending: false })
      .limit(96),
  ]);

  const answerRows = ((answers ?? []) as AnswerRow[]).filter((answer) => {
    const topic = first(answer.topics);
    return topic?.type !== "weekly" || Boolean(topic.reveal_at && topic.reveal_at <= now);
  });
  const replyRows = ((replies ?? []) as ReplyRow[]).filter((reply) => {
    const answer = first(reply.topic_answers);
    const topic = first(answer?.topics);
    return topic?.type !== "weekly" || Boolean(topic.reveal_at && topic.reveal_at <= now);
  });
  const answerIds = answerRows.map((answer) => answer.id);
  const replyAnswerIds = replyRows.map((reply) => reply.topic_answer_id);
  const allAnswerIds = Array.from(new Set([...answerIds, ...replyAnswerIds]));

  const [{ data: likes }, { data: commentsForCounts }, { data: currentProfile }] = await Promise.all([
    allAnswerIds.length > 0 ? readClient.from("likes").select("topic_answer_id, user_id").in("topic_answer_id", allAnswerIds) : Promise.resolve({ data: [] as Pick<Like, "topic_answer_id" | "user_id">[] }),
    allAnswerIds.length > 0 ? readClient.from("comments").select("topic_answer_id, parent_reply_id").in("topic_answer_id", allAnswerIds) : Promise.resolve({ data: [] as Pick<Comment, "topic_answer_id" | "parent_reply_id">[] }),
    user ? supabase.from("profiles").select("qualified").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null as CurrentProfile | null }),
  ]);

  const likeCounts = new Map<string, number>();
  for (const like of likes ?? []) likeCounts.set(like.topic_answer_id, (likeCounts.get(like.topic_answer_id) ?? 0) + 1);
  const likedAnswerIds = new Set((likes ?? []).filter((like) => user && like.user_id === user.id).map((like) => like.topic_answer_id));
  const commentCounts = new Map<string, number>();
  const childReplyCounts = new Map<string, number>();
  for (const comment of commentsForCounts ?? []) {
    commentCounts.set(comment.topic_answer_id, (commentCounts.get(comment.topic_answer_id) ?? 0) + 1);
    if (comment.parent_reply_id) childReplyCounts.set(comment.parent_reply_id, (childReplyCounts.get(comment.parent_reply_id) ?? 0) + 1);
  }

  const userIds = Array.from(new Set([...answerRows.map((answer) => answer.user_id), ...replyRows.map((reply) => reply.user_id)]));
  const { data: profiles } = userIds.length > 0
    ? await readClient.from("profiles").select("id, display_name, username, rank, avatar_url").in("id", userIds)
    : { data: [] as ProfileLite[] };
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const answerItems: ThoughtFeedItem[] = answerRows.map((answer) => {
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
      likedByCurrentUser: likedAnswerIds.has(answer.id),
      isSample: answer.is_sample || Boolean(topic.is_sample),
      author: {
        id: answer.user_id,
        displayName: displayName(profile),
        username: profile?.username,
        rank: profile?.rank,
        avatarUrl: profile?.avatar_url,
        href: profileHref(profile),
      },
    };
  });

  const replyItems: ThoughtFeedItem[] = replyRows.map((reply) => {
    const answer = first(reply.topic_answers) ?? {};
    const topic = first(answer.topics) ?? {};
    const topicId = answer.topic_id ?? "";
    const answerId = answer.id ?? reply.topic_answer_id;
    const profile = profilesById.get(reply.user_id);
    return {
      id: `reply-${reply.id}`,
      type: replyThoughtType(reply.reply_type),
      topicId,
      answerId,
      href: replyHref(topic, topicId, reply.id),
      discussionTitle: topic.title ?? "議論",
      discussionType: topic.type,
      content: reply.content,
      createdAt: reply.created_at,
      likeCount: likeCounts.get(answerId) ?? 0,
      commentCount: childReplyCounts.get(reply.id) ?? 0,
      likedByCurrentUser: likedAnswerIds.has(answerId),
      parentReplyId: reply.id,
      isSample: reply.is_sample || Boolean(topic.is_sample),
      author: {
        id: reply.user_id,
        displayName: displayName(profile),
        username: profile?.username,
        rank: profile?.rank,
        avatarUrl: profile?.avatar_url,
        href: profileHref(profile),
      },
    };
  });

  const items = [...answerItems, ...replyItems]
    .sort((a, b) => thoughtScore(b) - thoughtScore(a) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 140);

  const canInteract = Boolean(user && currentProfile?.qualified);
  const blockedReason = user ? "認定試験に合格すると議論に参加できます" : "ログインすると議論に参加できます";

  const feedStats = [
    { label: "回答", value: items.filter((item) => item.type === "ANSWER").length },
    { label: "反論", value: items.filter((item) => item.type === "COUNTER" || item.type === "REBUTTAL").length },
    { label: "質問", value: items.filter((item) => item.type === "QUESTION").length },
    { label: "補足", value: items.filter((item) => item.type === "SUPPORT").length },
  ];
  const hotTopics = Array.from(new Map(items.map((item) => [item.topicId, item])).values()).slice(0, 5);

  return (
    <PageShell className="max-w-7xl pb-32">
      <OnboardingHint storageKey="logic-league:onboarding:timeline" title="ここは思考フィードです。" className="mb-5">
        議題・回答・反論・補足・質問が流れます。人ではなく、議論に投げ込まれたアイデアを追うためのページです。
      </OnboardingHint>
      <div className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)_19rem] lg:items-start">
        <aside className="hidden space-y-3 lg:sticky lg:top-8 lg:block">
          <div className="rounded-[1.5rem] border border-amber-300/18 bg-[radial-gradient(circle_at_top,rgba(215,180,106,0.12),transparent_55%),rgba(255,255,255,0.035)] p-4">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">Flow</p>
            <h2 className="mt-2 text-xl font-black text-white">思考だけを流す</h2>
            <p className="mt-3 text-sm leading-6 text-league-silver">Rank昇格・実績解除・プロフィール更新を除外し、回答・反論・再反論・補足・質問に集中します。</p>
          </div>
          <div className="grid gap-2">
            {feedStats.map((stat) => <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-league-muted">{stat.label}</p><p className="mt-1 text-2xl font-black text-white">{stat.value}</p></div>)}
          </div>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#070a12]/72 shadow-[0_24px_90px_rgba(0,0,0,0.3)]">
          <header className="sticky top-0 z-10 border-b border-white/10 bg-league-black/88 px-4 py-3 backdrop-blur sm:px-5 lg:top-0">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">Thought Feed</p>
            <h1 className="mt-1 text-xl font-black text-white sm:text-2xl">思考フィード</h1>
            <p className="mt-1 text-sm font-bold text-league-muted">回答・反論・再反論・補足・質問だけを流します。主役はユーザーではなく、議論に投げ込まれたアイデアです。</p>
          </header>
          <ThoughtFeed items={items} canInteract={canInteract} blockedReason={blockedReason} />
        </section>

        <aside className="hidden space-y-3 lg:sticky lg:top-8 lg:block">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">Hot Discussions</p>
            <div className="mt-3 space-y-2.5">
              {hotTopics.map((item) => (
                <a key={item.topicId} href={item.href} className="block rounded-2xl border border-white/10 bg-black/20 p-3 transition hover:border-amber-300/30 hover:bg-white/[0.06]">
                  <p className="line-clamp-2 text-sm font-black leading-6 text-white">{item.discussionTitle}</p>
                  <p className="mt-2 text-xs font-bold text-league-muted">{item.likeCount} likes · {item.commentCount} comments</p>
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
