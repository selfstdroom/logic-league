import Link from "next/link";
import { RankBadge } from "@/components/rank/RankBadge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { HeroPanel, PageShell } from "@/components/ui/DesignSystem";
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

const activityStyles: Record<ActivityType, { label: string; tone: string; icon: string }> = {
  ANSWER: { label: "回答しました", tone: "border-sky-300/30 bg-sky-300/10 text-sky-200", icon: "✍️" },
  COUNTER: { label: "反論しました", tone: "border-red-300/30 bg-red-300/10 text-red-200", icon: "⚔️" },
  SUPPORT: { label: "賛成・補足しました", tone: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200", icon: "🤝" },
  QUESTION: { label: "質問しました", tone: "border-purple-300/30 bg-purple-300/10 text-purple-200", icon: "❓" },
  COMMENT: { label: "コメントしました", tone: "border-white/15 bg-white/[0.06] text-league-silver", icon: "💬" },
  RANK_UP: { label: "Rankが昇格しました", tone: "border-amber-300/30 bg-amber-300/10 text-league-gold", icon: "⬆️" },
  ACHIEVEMENT: { label: "実績を獲得しました", tone: "border-amber-300/30 bg-amber-300/10 text-league-gold", icon: "🏅" },
  HALL_OF_FAME: { label: "Hall of Fame入りしました", tone: "border-yellow-300/30 bg-yellow-300/10 text-yellow-100", icon: "🏛️" },
  WEEKLY_WIN: { label: "Weekly Leagueで入賞しました", tone: "border-orange-300/30 bg-orange-300/10 text-orange-100", icon: "🏆" },
};

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
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
    return <img src={profile.avatar_url} alt="" className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/10" />;
  }
  return <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-sm font-black text-league-gold">{initial}</span>;
}

function ActivityCard({ item }: { item: TimelineItem }) {
  const style = activityStyles[item.type];
  return (
    <Card className="hover:-translate-y-1 hover:border-amber-300/35 hover:bg-white/[0.06]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Link href={profileHref(item.profile, item.userId)} className="flex min-w-0 items-center gap-3 rounded-xl transition hover:text-league-gold">
          <Avatar profile={item.profile} />
          <span className="min-w-0">
            <span className="flex items-center gap-2 truncate font-black text-white"><span className="truncate">{displayName(item.profile)}</span><RankBadge rank={item.profile?.rank} size="xs" /></span>
            <span className="block truncate text-xs text-league-muted">@{item.profile?.username ?? item.userId} · Rank {item.profile?.rank ?? "—"}</span>
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-league-silver">
          <span className={`rounded-full border px-3 py-1 ${style.tone}`}>{style.icon} {style.label}</span>
          <time className="rounded-full border border-white/10 px-3 py-1">{formatDateTime(item.createdAt)}</time>
        </div>
      </div>

      <Link href={item.href} className="mt-5 block rounded-[1.25rem] border border-white/10 bg-black/20 p-5 transition hover:border-amber-300/35">
        <div className="flex flex-wrap items-center gap-2">
          {item.topic ? <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-league-gold">{formatDiscussionType(item.topic.type)}</span> : null}
          {item.topic?.category ? <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-league-silver">{formatTopicCategory(item.topic.category)}</span> : null}
          {item.meta ? <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-league-silver">{item.meta}</span> : null}
        </div>
        <h2 className="mt-3 text-xl font-black leading-snug text-white">{item.topic?.title ?? style.label}</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-league-silver">{createPreview(item.content, 220)}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-league-muted">
          {typeof item.likeCount === "number" ? <span>いいね {item.likeCount}</span> : null}
          {typeof item.commentCount === "number" ? <span>コメント {item.commentCount}</span> : null}
          <span>詳細を見る →</span>
        </div>
      </Link>
    </Card>
  );
}

export default async function TimelinePage() {
  const supabase = await createClient();
  const readClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;
  const now = new Date().toISOString();

  const [{ data: dailyAnswers }, { data: weeklyAnswers }, { data: comments }, { data: ratingRows }, { data: achievementRows }, { data: fameRows }] = await Promise.all([
    readClient.from("topic_answers").select("id, topic_id, user_id, answer_type, content, created_at, topics!inner(id, type, category, title, status)").eq("topics.type", "daily").eq("topics.status", "published").order("created_at", { ascending: false }).limit(24),
    readClient.from("topic_answers").select("id, topic_id, user_id, answer_type, content, created_at, topics!inner(id, type, category, title, status, reveal_at)").eq("topics.type", "weekly").eq("topics.status", "published").lte("topics.reveal_at", now).order("created_at", { ascending: false }).limit(12),
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

  const items = [...answerItems, ...commentItems, ...rankItems, ...achievementItems, ...fameItems]
    .filter((item) => item.href && item.userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 48);

  return (
    <PageShell>
      <HeroPanel eyebrow="公開タイムライン" title="知的な議論が今まさに動いている場所" actions={<>
        <Link href="/topics" className="rounded-full border border-amber-300/30 bg-amber-300/10 px-5 py-3 text-sm font-black text-league-gold transition hover:bg-amber-300/20 hover:text-white">議論に参加する</Link>
        <Link href="/login" className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:border-amber-300/30">ログインする</Link>
      </>}>
        回答、反論、補足、コメント、入賞、実績、Rank昇格が一つの活動フィードとして流れます。閲覧は誰でも可能、参加アクションにはログインが必要です。
      </HeroPanel>

      <section className="mt-8 space-y-5">
        {items.map((item) => <ActivityCard key={item.id} item={item} />)}
      </section>

      {items.length === 0 ? <EmptyState title="まだタイムラインはありません。">回答やコメントが投稿されると、ここに公開タイムラインとして表示されます。</EmptyState> : null}
    </PageShell>
  );
}
