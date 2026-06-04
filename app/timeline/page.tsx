import Link from "next/link";
import { RankBadge } from "@/components/rank/RankBadge";
import { LeagueIcon, type LeagueIconName } from "@/components/ui/LeagueIcon";
import { PageShell } from "@/components/ui/DesignSystem";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createPreview, formatDateTime, formatDiscussionType, formatTopicCategory } from "@/lib/topics/format";
import type { Comment, Like, TopicAnswer } from "@/types/database";
import type { Profile } from "@/types/logic-league";

export const dynamic = "force-dynamic";

type ActivityType = "ANSWER" | "COUNTER" | "SUPPORT" | "QUESTION" | "COMMENT" | "RANK_UP" | "ACHIEVEMENT" | "HALL_OF_FAME" | "WEEKLY_WIN";
type ProfileLite = Pick<Profile, "id" | "display_name" | "username" | "rank" | "avatar_url">;

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

type RatingRow = { id: string; user_id: string; old_rating: number | null; new_rating: number | null; reason: string | null; created_at: string };
type AchievementRow = { id: string; user_id: string; unlocked_at: string; achievements?: { title?: string | null; description?: string | null; badge_icon?: string | null; icon?: string | null } | { title?: string | null; description?: string | null; badge_icon?: string | null; icon?: string | null }[] | null };
type FameRow = { id: string; topic_id: string | null; winner_user_id: string | null; final_score: number | null; created_at: string; topics?: TopicLite | TopicLite[] | null };

type TimelineItem = {
  id: string;
  type: ActivityType;
  topicId?: string | null;
  answerId?: string | null;
  userId: string;
  content: string;
  createdAt: string;
  href: string;
  topic?: TopicLite;
  profile?: ProfileLite;
  likeCount?: number;
  commentCount?: number;
  meta?: string;
};

const activityStyles: Record<ActivityType, { label: string; noun: string; tone: string; icon: LeagueIconName }> = {
  ANSWER: { label: "回答", noun: "Answer", tone: "border-sky-300/30 bg-sky-300/10 text-sky-200", icon: "answer" },
  COUNTER: { label: "反論", noun: "Counterargument", tone: "border-red-300/30 bg-red-300/10 text-red-200", icon: "counter" },
  SUPPORT: { label: "賛成・補足", noun: "Support", tone: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200", icon: "support" },
  QUESTION: { label: "質問", noun: "Question", tone: "border-purple-300/30 bg-purple-300/10 text-purple-200", icon: "question" },
  COMMENT: { label: "コメント", noun: "Comment", tone: "border-white/15 bg-white/[0.06] text-league-silver", icon: "comment" },
  RANK_UP: { label: "Rank昇格", noun: "Rank update", tone: "border-amber-300/30 bg-amber-300/10 text-league-gold", icon: "rankUp" },
  ACHIEVEMENT: { label: "実績獲得", noun: "Achievement", tone: "border-amber-300/30 bg-amber-300/10 text-league-gold", icon: "achievements" },
  HALL_OF_FAME: { label: "Hall of Fame", noun: "Hall of Fame", tone: "border-yellow-300/30 bg-yellow-300/10 text-yellow-100", icon: "hallOfFame" },
  WEEKLY_WIN: { label: "Weekly入賞", noun: "Weekly winner", tone: "border-orange-300/30 bg-orange-300/10 text-orange-100", icon: "weeklyLeague" },
};

const thoughtPriority: Record<ActivityType, number> = {
  ANSWER: 0,
  COUNTER: 0,
  SUPPORT: 0,
  QUESTION: 0,
  COMMENT: 1,
  WEEKLY_WIN: 2,
  HALL_OF_FAME: 3,
  RANK_UP: 4,
  ACHIEVEMENT: 5,
};

function compareTimelineItems(a: TimelineItem, b: TimelineItem) {
  const priorityDelta = thoughtPriority[a.type] - thoughtPriority[b.type];
  if (priorityDelta !== 0) return priorityDelta;
  const engagementDelta = (b.likeCount ?? 0) + (b.commentCount ?? 0) - ((a.likeCount ?? 0) + (a.commentCount ?? 0));
  if (engagementDelta !== 0) return engagementDelta;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function isThoughtItem(item: TimelineItem) {
  return item.type === "ANSWER" || item.type === "COUNTER" || item.type === "SUPPORT" || item.type === "QUESTION";
}

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function TimelineEmptyState() {
  return <p className="py-8 text-center text-sm font-bold text-league-muted">まだ活動はありません</p>;
}

function displayName(profile?: Pick<Profile, "display_name" | "username">) {
  return profile?.display_name || profile?.username || "Logic Leagueユーザー";
}

function profileHref(profile: Pick<Profile, "id" | "username"> | undefined, userId: string) {
  return profile?.username ? `/profile/${profile.username}` : `/profile/${profile?.id ?? userId}`;
}

function answerActivityType(answerType: TopicAnswer["answer_type"]): ActivityType {
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

function Avatar({ profile }: { profile?: ProfileLite }) {
  const initial = displayName(profile).slice(0, 1).toUpperCase();
  if (profile?.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10" />;
  }
  return <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm font-black text-league-gold">{initial}</span>;
}

function ActivityCard({ item }: { item: TimelineItem }) {
  const style = activityStyles[item.type];
  const thoughtFirst = isThoughtItem(item);
  return (
    <article className={`border-b border-white/10 px-4 py-5 transition hover:bg-white/[0.035] sm:px-5 ${thoughtFirst ? "bg-white/[0.018]" : ""}`}>
      <Link href={item.href} className="block rounded-xl transition focus:outline-none focus:ring-2 focus:ring-amber-300/35">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-black uppercase tracking-[0.16em] ${style.tone}`}>
            <LeagueIcon name={style.icon} size={13} />
            {style.noun}
          </span>
          {thoughtFirst ? <span className="rounded-full border border-league-gold/20 bg-league-gold/10 px-2.5 py-0.5 text-[0.7rem] font-black uppercase tracking-[0.16em] text-league-gold">Idea first</span> : null}
          {item.topic ? <span className="text-xs font-bold text-league-gold">{formatDiscussionType(item.topic.type)}</span> : null}
          {item.topic?.category ? <span className="text-xs font-bold text-league-muted">{formatTopicCategory(item.topic.category)}</span> : null}
          {item.meta ? <span className="text-xs font-bold text-league-muted">{item.meta}</span> : null}
        </div>

        <h2 className="mt-3 line-clamp-2 text-base font-black leading-snug text-white">{item.topic?.title ?? style.label}</h2>
        <p className="mt-3 whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-black/20 p-4 text-[0.95rem] leading-7 text-league-silver">{createPreview(item.content, 220)}</p>
      </Link>

      <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-3 text-xs font-bold text-league-muted">
        <div className="flex min-w-0 items-center gap-2">
          <Link href={profileHref(item.profile, item.userId)} className="shrink-0 rounded-full transition hover:opacity-80" aria-label={`${displayName(item.profile)}のプロフィール`}>
            <Avatar profile={item.profile} />
          </Link>
          <div className="min-w-0">
            <Link href={profileHref(item.profile, item.userId)} className="flex min-w-0 items-center gap-1.5 text-white transition hover:text-league-gold">
              <span className="truncate">{displayName(item.profile)}</span>
              <RankBadge rank={item.profile?.rank} size="xs" />
            </Link>
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="truncate">@{item.profile?.username ?? item.userId}</span>
              <span>·</span>
              <time>{formatDateTime(item.createdAt)}</time>
            </div>
          </div>
        </div>

        <Link href={item.href} className="flex shrink-0 flex-wrap gap-4 transition hover:text-league-gold">
          {typeof item.likeCount === "number" ? <span>いいね {item.likeCount}</span> : null}
          {typeof item.commentCount === "number" ? <span>コメント {item.commentCount}</span> : null}
          <span>詳細を見る →</span>
        </Link>
      </div>
    </article>
  );
}

export default async function TimelinePage() {
  const supabase = await createClient();
  const readClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;
  const now = new Date().toISOString();

  const [{ data: dailyAnswers }, { data: weeklyAnswers }, { data: comments }, { data: ratingRows }, { data: achievementRows }, { data: fameRows }] = await Promise.all([
    readClient.from("topic_answers").select("id, topic_id, user_id, answer_type, content, created_at, topics!inner(id, type, category, title, status)").eq("topics.type", "daily").eq("topics.status", "published").order("created_at", { ascending: false }).limit(36),
    readClient.from("topic_answers").select("id, topic_id, user_id, answer_type, content, created_at, topics!inner(id, type, category, title, status, reveal_at)").eq("topics.type", "weekly").eq("topics.status", "published").lte("topics.reveal_at", now).order("created_at", { ascending: false }).limit(20),
    readClient.from("comments").select("id, topic_answer_id, user_id, content, created_at, topic_answers!inner(id, topic_id, topics!inner(id, type, category, title, status))").eq("topic_answers.topics.status", "published").order("created_at", { ascending: false }).limit(24),
    readClient.from("rating_histories").select("id, user_id, old_rating, new_rating, reason, created_at").gt("new_rating", 0).order("created_at", { ascending: false }).limit(8),
    readClient.from("user_achievements").select("id, user_id, unlocked_at, achievements(title, description, badge_icon, icon)").order("unlocked_at", { ascending: false }).limit(10),
    readClient.from("hall_of_fame").select("id, topic_id, winner_user_id, final_score, created_at, topics(id, type, category, title)").order("created_at", { ascending: false }).limit(10),
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
    ...((ratingRows ?? []) as RatingRow[]).map((row) => row.user_id),
    ...((achievementRows ?? []) as AchievementRow[]).map((row) => row.user_id),
    ...((fameRows ?? []) as FameRow[]).map((row) => row.winner_user_id).filter((id): id is string => Boolean(id)),
  ]));
  const { data: profiles } = userIds.length > 0
    ? await readClient.from("profiles").select("id, display_name, username, rank, avatar_url").in("id", userIds)
    : { data: [] as ProfileLite[] };
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const answerItems: TimelineItem[] = answerRows.map((answer) => {
    const topic = first(answer.topics) ?? {};
    const href = `${topic.type === "weekly" ? "/weekly" : "/topics"}/${answer.topic_id}${topic.type === "weekly" ? "" : `#answer-${answer.id}`}`;
    return {
      id: `answer-${answer.id}`,
      type: answerActivityType(answer.answer_type),
      topicId: answer.topic_id,
      answerId: answer.id,
      userId: answer.user_id,
      content: answer.content,
      createdAt: answer.created_at,
      href,
      topic,
      profile: profilesById.get(answer.user_id),
      likeCount: likeCounts.get(answer.id) ?? 0,
      commentCount: commentCounts.get(answer.id) ?? 0,
    };
  });

  const commentItems: TimelineItem[] = commentRows.map((comment) => {
    const answer = first(comment.topic_answers);
    const topic = first(answer?.topics);
    const answerId = answer?.id ?? comment.topic_answer_id;
    return {
      id: `comment-${comment.id}`,
      type: "COMMENT",
      topicId: answer?.topic_id ?? topic?.id ?? "",
      answerId,
      userId: comment.user_id,
      content: comment.content,
      createdAt: comment.created_at,
      href: `/topics/${answer?.topic_id ?? topic?.id ?? ""}#comment-${comment.id}`,
      topic: topic ?? {},
      profile: profilesById.get(comment.user_id),
      likeCount: likeCounts.get(answerId) ?? 0,
      commentCount: commentCounts.get(answerId) ?? 0,
    };
  });

  const rankItems: TimelineItem[] = ((ratingRows ?? []) as RatingRow[]).filter((row) => (row.new_rating ?? 0) > (row.old_rating ?? 0)).map((row) => ({
    id: `rank-${row.id}`,
    type: "RANK_UP",
    userId: row.user_id,
    content: `Rating ${row.old_rating ?? "—"} → ${row.new_rating ?? "—"}。成長の軌跡がプロフィールに記録されました。`,
    createdAt: row.created_at,
    href: profileHref(profilesById.get(row.user_id), row.user_id),
    profile: profilesById.get(row.user_id),
    meta: row.reason ?? "Rating更新",
  }));

  const achievementItems: TimelineItem[] = ((achievementRows ?? []) as AchievementRow[]).map((row) => {
    const achievement = first(row.achievements);
    return {
      id: `achievement-${row.id}`,
      type: "ACHIEVEMENT",
      userId: row.user_id,
      content: `${achievement?.badge_icon ?? achievement?.icon ?? "🏅"} ${achievement?.title ?? "新しい実績"}${achievement?.description ? ` — ${achievement.description}` : ""}`,
      createdAt: row.unlocked_at,
      href: profileHref(profilesById.get(row.user_id), row.user_id),
      profile: profilesById.get(row.user_id),
      meta: "実績",
    };
  });

  const fameItems: TimelineItem[] = ((fameRows ?? []) as FameRow[]).filter((row) => row.winner_user_id).map((row) => {
    const topic = first(row.topics) ?? undefined;
    return {
      id: `fame-${row.id}`,
      type: row.final_score && row.final_score > 0 ? "WEEKLY_WIN" : "HALL_OF_FAME",
      topicId: row.topic_id,
      userId: row.winner_user_id as string,
      content: `競技議論で高評価を獲得し、Hall of Fameに記録されました。Final Score ${row.final_score ?? "—"}`,
      createdAt: row.created_at,
      href: `/hall-of-fame/${row.id}`,
      topic,
      profile: profilesById.get(row.winner_user_id as string),
      meta: "Hall of Fame",
    };
  });

  const thoughtItems = answerItems.filter(isThoughtItem).sort(compareTimelineItems);
  const contextItems = [...commentItems, ...rankItems, ...achievementItems, ...fameItems].sort(compareTimelineItems);
  const items = [...thoughtItems, ...contextItems]
    .filter((item) => item.href && item.userId)
    .slice(0, 48);

  return (
    <PageShell className="max-w-2xl pb-28">
      <header className="sticky top-0 z-10 -mx-4 border-b border-white/10 bg-league-black/85 px-4 py-3 backdrop-blur sm:-mx-5 sm:px-5">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">Stream of ideas</p>
        <h1 className="mt-1 text-xl font-black text-white">タイムライン</h1>
        <p className="mt-1 text-sm font-bold text-league-muted">回答・反論・賛成補足・質問を優先し、投稿者よりも思考そのものを主役に表示します。</p>
      </header>

      <section className="-mx-4 border-x border-white/10 sm:-mx-5">
        {items.map((item) => <ActivityCard key={item.id} item={item} />)}
        {items.length === 0 ? <TimelineEmptyState /> : null}
      </section>

      <Link href="/topics" className="fixed bottom-5 right-5 z-30 rounded-full bg-league-gold px-5 py-4 text-sm font-black text-league-black shadow-[0_14px_45px_rgba(215,180,106,0.35)] transition hover:-translate-y-0.5 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-100 sm:bottom-7 sm:right-7">
        議論を探す
      </Link>
    </PageShell>
  );
}
