import type { ReactNode } from "react";
import Link from "next/link";
import { AchievementBadge } from "@/components/ui/AchievementBadge";
import { achievementDefinitions } from "@/lib/achievements";
import { archetypes } from "@/lib/archetypes";
import { buildEarnedTitleOptions, resolveDisplayTitle } from "@/lib/profileTitles";
import { deviationTypeLabel, formatDeviation, getDeviationGoalText, resolveDisplayDeviationType } from "@/lib/thinkingDeviation";
import { getRankByRating } from "@/lib/rank";
import { RankBadge } from "@/components/rank/RankBadge";
import { RankProgress } from "@/components/rank/RankProgress";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader, StatCard } from "@/components/ui/DesignSystem";
import { createClient } from "@/lib/supabase/server";
import { createPreview, formatDateTime, formatDiscussionType, formatReplyType } from "@/lib/topics/format";
import type { DebateReplyType, ThinkingDeviationHistory, TopicAnswerType } from "@/types/database";
import type { ArchetypeName, Profile } from "@/types/logic-league";

type ProfileVisibilityKey =
  | "show_thought_log_public"
  | "show_exam_result_public"
  | "show_competitive_history_public"
  | "show_achievements_public";

type ProfileWithVisibility = Profile & Partial<Record<ProfileVisibilityKey, boolean | null>>;

type TopicAnswerHistoryRow = {
  id: string;
  topic_id: string;
  answer_type: TopicAnswerType | null;
  content: string;
  is_anonymous: boolean | null;
  ai_total_score: number | null;
  final_score: number | null;
  vote_count: number | null;
  ranking_position: number | null;
  created_at: string;
  topics: { category?: string | null; title?: string | null; type?: string | null } | { category?: string | null; title?: string | null; type?: string | null }[] | null;
};

type CountRow = { topic_answer_id: string };
type DebateReplyHistoryRow = {
  id: string;
  topic_answer_id: string;
  parent_reply_id: string | null;
  reply_type: DebateReplyType;
  content: string;
  created_at: string;
  topic_answers?: { id?: string | null; topic_id?: string | null; topics?: { category?: string | null; title?: string | null; type?: string | null } | { category?: string | null; title?: string | null; type?: string | null }[] | null } | { id?: string | null; topic_id?: string | null; topics?: { category?: string | null; title?: string | null; type?: string | null } | { category?: string | null; title?: string | null; type?: string | null }[] | null }[] | null;
};
type AchievementRow = { achievement_key: string | null; achievement_id: string | null; unlocked_at: string | null; created_at: string; achievements?: { title?: string | null; description?: string | null; icon?: string | null; badge_icon?: string | null; key?: string | null } | { title?: string | null; description?: string | null; icon?: string | null; badge_icon?: string | null; key?: string | null }[] | null };
type RatingHistoryRow = { old_rating: number | null; new_rating: number | null; delta: number | null; created_at: string; topics?: { title?: string | null } | { title?: string | null }[] | null };
type DeviationHistoryRow = ThinkingDeviationHistory & { topics?: { title?: string | null } | { title?: string | null }[] | null };

type TopicActivityItem = {
  id: string;
  topic_id: string;
  answer_type: TopicAnswerType | null;
  content: string;
  category: string;
  title: string;
  topicType: string;
  activityLabel?: string;
  activityHref?: string;
  likeCount: number;
  commentCount: number;
  score: number | null;
  rankingPosition: number | null;
  created_at: string;
};

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function profileVisible(profile: ProfileWithVisibility, key: ProfileVisibilityKey, isOwnProfile: boolean) {
  return isOwnProfile || profile[key] !== false;
}

function discussionHref(item: Pick<TopicActivityItem, "topicType" | "topic_id" | "id">) {
  return item.topicType === "weekly" ? `/weekly/${item.topic_id}` : `/topics/${item.topic_id}#answer-${item.id}`;
}

function scoreOf(answer: Pick<TopicAnswerHistoryRow, "final_score" | "ai_total_score" | "vote_count">) {
  return answer.final_score ?? answer.ai_total_score ?? answer.vote_count ?? null;
}

function answerTypeLabel(answerType: TopicAnswerType | null) {
  switch (answerType) {
    case "Counter":
      return "反論";
    case "Support":
      return "補足";
    case "Question":
      return "質問";
    default:
      return "回答";
  }
}

function VisibilityEmpty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="border-dashed border-white/10 bg-white/[0.025]">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-league-muted">Private</p>
      <h2 className="mt-2 text-xl font-black text-white">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-league-muted">{children}</p>
    </Card>
  );
}

function ProfileStartEmptyState({ isOwnProfile }: { isOwnProfile: boolean }) {
  const actions = [
    { label: "認定試験を受験", href: "/exam" },
    { label: "Daily Discussionへ参加", href: "/topics" },
    { label: "Competitive Discussionへ参加", href: "/weekly" },
  ];
  return (
    <Card className="border-dashed border-amber-300/25 bg-[radial-gradient(circle_at_top_right,rgba(215,180,106,0.1),transparent_30%),rgba(255,255,255,0.035)]">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-league-gold">First steps</p>
      <h2 className="mt-2 text-2xl font-black text-white">Logic Leagueを始めたばかりです。</h2>
      <p className="mt-3 text-sm leading-7 text-league-silver">まだ公開活動はありません。回答・競技議論・実績解除が発生すると、このプロフィールと思考フィードに実データとして表示されます。</p>
      {isOwnProfile ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {actions.map((action) => (
            <Link key={action.href} href={action.href} className="rounded-2xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm font-black text-league-gold transition hover:bg-amber-300/20 hover:text-white">
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function ProfileField({ label, value, href }: { label: string; value: string | number; href?: string | null }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <dt className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-league-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-bold text-league-silver">
        {href ? <Link href={href} target="_blank" rel="noreferrer" className="text-league-gold hover:text-white">{value}</Link> : value}
      </dd>
    </div>
  );
}

function Avatar({ profile }: { profile: ProfileWithVisibility }) {
  if (profile.avatar_url) {
    return <div className="h-20 w-20 shrink-0 rounded-[1.45rem] border border-amber-300/35 bg-cover bg-center shadow-[0_0_50px_rgba(215,180,106,0.18)] sm:h-24 sm:w-24" style={{ backgroundImage: `url(${profile.avatar_url})` }} aria-label={`${profile.display_name ?? profile.username} avatar`} />;
  }

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.45rem] border border-amber-300/35 bg-gradient-to-br from-league-gold via-white to-slate-500 text-3xl font-black text-black shadow-[0_0_50px_rgba(215,180,106,0.18)] sm:h-24 sm:w-24">
      {(profile.display_name?.[0] ?? profile.username[0]).toUpperCase()}
    </div>
  );
}

function PremiumBadge({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "silver" | "emerald" }) {
  const className = tone === "emerald"
    ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
    : tone === "silver"
      ? "border-white/10 bg-white/[0.06] text-league-silver"
      : "border-amber-300/30 bg-amber-300/10 text-league-gold";
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${className}`}>{children}</span>;
}

function ProfileMiniStat({ label, value, tone = "silver" }: { label: string; value: ReactNode; tone?: "gold" | "silver" | "emerald" }) {
  const toneClass = tone === "gold"
    ? "border-amber-300/25 bg-[linear-gradient(145deg,rgba(215,180,106,0.14),rgba(255,255,255,0.035))] text-league-gold"
    : tone === "emerald"
      ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
      : "border-white/10 bg-white/[0.045] text-league-silver";

  return (
    <div className={`relative overflow-hidden rounded-[1.15rem] border px-3 py-3 ${toneClass}`}>
      <div className="pointer-events-none absolute -right-8 -top-8 h-16 w-16 rounded-full bg-white/10 blur-2xl" />
      <p className="relative truncate text-[0.64rem] font-black uppercase tracking-[0.18em] opacity-85">{label}</p>
      <p className="relative mt-1.5 truncate text-[1.35rem] font-black leading-none text-white sm:text-2xl">{value}</p>
    </div>
  );
}

export async function ProfileView({ profile: rawProfile, viewerId, saved }: { profile: Profile; viewerId: string; saved?: string }) {
  const profile = rawProfile as ProfileWithVisibility;
  const supabase = await createClient();
  const isOwnProfile = viewerId === profile.id;
  const profileClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? (await import("@/lib/supabase/admin")).createAdminClient() : supabase;
  const readClient = profileClient;

  const showThoughtLog = profileVisible(profile, "show_thought_log_public", isOwnProfile);
  const showExam = profileVisible(profile, "show_exam_result_public", isOwnProfile);
  const showCompetitive = profileVisible(profile, "show_competitive_history_public", isOwnProfile);
  const showAchievements = profileVisible(profile, "show_achievements_public", isOwnProfile);

  const [{ count: totalAnswerCount }, { count: hallOfFameCount }, { count: competitiveCount }, { count: top10Count }, { count: winCount }, { data: achievements }, { data: ratingHistories }, { data: examAnswers }, { data: topicAnswers }, { data: debateReplies }, { data: deviationHistories }] = await Promise.all([
    readClient.from("topic_answers").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
    profileClient.from("hall_of_fame").select("id", { count: "exact", head: true }).eq("winner_user_id", profile.id),
    profileClient.from("topic_answers").select("id, topics!inner(type)", { count: "exact", head: true }).eq("user_id", profile.id).eq("topics.type", "weekly"),
    profileClient.from("topic_answers").select("id, topics!inner(type)", { count: "exact", head: true }).eq("user_id", profile.id).eq("topics.type", "weekly").lte("ranking_position", 10),
    profileClient.from("topic_answers").select("id, topics!inner(type)", { count: "exact", head: true }).eq("user_id", profile.id).eq("topics.type", "weekly").eq("ranking_position", 1),
    profileClient.from("user_achievements").select("achievement_key, achievement_id, unlocked_at, created_at, achievements(title, description, icon, badge_icon, key)").eq("user_id", profile.id).order("created_at", { ascending: false }),
    profileClient.from("rating_histories").select("old_rating, new_rating, delta, created_at, topics(title)").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(100),
    profileClient.from("exam_answers").select("id, answer, created_at, predicted_deviation, archetype, total_score, structure_score, hypothesis_score, originality_score, feasibility_score, risk_score, summary, strength, weakness, upper_gap").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(showExam ? 10 : 1),
    readClient.from("topic_answers").select("id, topic_id, answer_type, content, is_anonymous, ai_total_score, final_score, vote_count, ranking_position, created_at, topics!inner(id, type, category, title)").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(80),
    readClient.from("comments").select("id, topic_answer_id, parent_reply_id, reply_type, content, created_at, topic_answers!inner(id, topic_id, topics!inner(id, type, category, title))").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(80),
    profileClient.from("thinking_deviation_histories").select("id, user_id, source_type, topic_id, exam_answer_id, topic_answer_id, deviation, score, label, created_at, topics(title)").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(120),
  ]);

  const topicAnswerRows = ((topicAnswers ?? []) as TopicAnswerHistoryRow[]).filter((answer) => isOwnProfile || !answer.is_anonymous);
  const topicAnswerIds = topicAnswerRows.map((answer) => answer.id);
  const [{ data: likes }, { data: comments }] = await Promise.all([
    topicAnswerIds.length > 0 ? readClient.from("likes").select("topic_answer_id").in("topic_answer_id", topicAnswerIds) : Promise.resolve({ data: [] as CountRow[] }),
    topicAnswerIds.length > 0 ? readClient.from("comments").select("topic_answer_id").in("topic_answer_id", topicAnswerIds) : Promise.resolve({ data: [] as CountRow[] }),
  ]);

  const likeCounts = new Map<string, number>();
  for (const like of (likes ?? []) as CountRow[]) likeCounts.set(like.topic_answer_id, (likeCounts.get(like.topic_answer_id) ?? 0) + 1);
  const commentCounts = new Map<string, number>();
  for (const comment of (comments ?? []) as CountRow[]) commentCounts.set(comment.topic_answer_id, (commentCounts.get(comment.topic_answer_id) ?? 0) + 1);

  const answerItems: TopicActivityItem[] = topicAnswerRows.map((answer) => {
    const topic = first(answer.topics);
    return {
      id: answer.id,
      topic_id: answer.topic_id,
      created_at: answer.created_at,
      answer_type: answer.answer_type,
      content: answer.content,
      category: topic?.category ?? "議論",
      title: topic?.title ?? "議論",
      topicType: topic?.type ?? "daily",
      activityLabel: `${topic?.title ?? "議論"}に${answerTypeLabel(answer.answer_type)}しました`,
      likeCount: likeCounts.get(answer.id) ?? 0,
      commentCount: commentCounts.get(answer.id) ?? 0,
      score: scoreOf(answer),
      rankingPosition: answer.ranking_position,
    };
  });
  const debateReplyRows = (debateReplies ?? []) as DebateReplyHistoryRow[];
  const replyItems: TopicActivityItem[] = debateReplyRows.map((reply) => {
    const answer = first(reply.topic_answers);
    const topic = first(answer?.topics);
    const topicId = answer?.topic_id ?? "";
    return {
      id: `reply-${reply.id}`,
      topic_id: topicId,
      created_at: reply.created_at,
      answer_type: reply.reply_type === "counter" ? "Counter" : reply.reply_type === "question" ? "Question" : "Support",
      content: reply.content,
      category: topic?.category ?? "議論",
      title: topic?.title ?? "議論",
      topicType: topic?.type ?? "daily",
      activityLabel: `${topic?.title ?? "議論"}に${formatReplyType(reply.reply_type)}しました`,
      activityHref: topic?.type === "weekly" ? `/weekly/${topicId}` : `/topics/${topicId}#reply-${reply.id}`,
      likeCount: 0,
      commentCount: 0,
      score: null,
      rankingPosition: null,
    };
  });
  const topicItems = [...answerItems, ...replyItems].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const featuredAnswer = [...topicItems].sort((a, b) => {
    const scoreDiff = (b.score ?? -1) - (a.score ?? -1);
    if (scoreDiff !== 0) return scoreDiff;
    const likeDiff = b.likeCount - a.likeCount;
    if (likeDiff !== 0) return likeDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  })[0] ?? null;

  const achievementRows = (achievements ?? []) as AchievementRow[];
  const earnedAchievementKeys = new Set(achievementRows.map((row) => row.achievement_key ?? row.achievement_id).filter(Boolean) as string[]);
  const unlockedAchievements = achievementDefinitions.filter((definition) => earnedAchievementKeys.has(definition.key)).map((definition) => ({
    ...definition,
    row: achievementRows.find((row) => (row.achievement_key ?? row.achievement_id) === definition.key),
  }));
  const lockedAchievements = achievementDefinitions.filter((definition) => !earnedAchievementKeys.has(definition.key));
  const recentAchievements = unlockedAchievements.slice(0, 4);
  const earnedTitleOptions = buildEarnedTitleOptions({ qualified: profile.qualified, rank: profile.rank, archetype: profile.archetype, achievementKeys: earnedAchievementKeys });
  const selectedTitle = resolveDisplayTitle(profile.display_title, earnedTitleOptions);

  const ratingRows = (ratingHistories ?? []) as RatingHistoryRow[];
  const deviationRows = (deviationHistories ?? []) as DeviationHistoryRow[];
  const certificationDeviation = profile.predicted_deviation != null ? Number(profile.predicted_deviation) : deviationRows.find((row) => row.source_type === "certification")?.deviation ?? null;
  const weeklyDeviationRows = deviationRows.filter((row) => row.source_type === "weekly");
  const latestWeeklyRow = weeklyDeviationRows[0] ?? null;
  const highestWeeklyRow = weeklyDeviationRows.slice().sort((a, b) => Number(b.deviation) - Number(a.deviation))[0] ?? null;
  const latestSeasonRow = deviationRows.find((row) => row.source_type === "season") ?? null;
  const selectedDeviationType = resolveDisplayDeviationType(profile.display_deviation_type);
  const selectedDeviation = selectedDeviationType === "latest_weekly"
    ? latestWeeklyRow?.deviation ?? null
    : selectedDeviationType === "highest_weekly"
      ? highestWeeklyRow?.deviation ?? null
      : selectedDeviationType === "season_average"
        ? latestSeasonRow?.deviation ?? null
        : certificationDeviation;
  const selectedDeviationTopic = first((selectedDeviationType === "highest_weekly" ? highestWeeklyRow : selectedDeviationType === "season_average" ? latestSeasonRow : latestWeeklyRow)?.topics);
  const deviationSourceLabel = selectedDeviationType === "certification"
    ? "初回認定試験より"
    : selectedDeviationTopic?.title
      ? `${selectedDeviationTopic.title}より`
      : deviationTypeLabel(selectedDeviationType);
  const weeklyTrend = weeklyDeviationRows.length >= 2 ? Number((Number(weeklyDeviationRows[0].deviation) - Number(weeklyDeviationRows[1].deviation)).toFixed(1)) : null;
  const nextDeviationGoal = getDeviationGoalText(latestWeeklyRow?.deviation ?? null, highestWeeklyRow?.deviation ?? null, latestSeasonRow?.deviation ?? null);
  const highestRating = Math.max(profile.rating, 0, ...ratingRows.flatMap((row) => [row.old_rating ?? 0, row.new_rating ?? 0]));
  const highestRank = getRankByRating(highestRating, true);
  const latestExam = (examAnswers ?? [])[0] as { summary?: string | null; strength?: string | null; weakness?: string | null; upper_gap?: string | null; archetype?: ArchetypeName | null } | undefined;
  const archetypeName = profile.archetype;
  const archetype = archetypeName ? archetypes[archetypeName] : null;
  const registeredAt = formatDateTime(profile.created_at);
  const availableSnsLinks = ([
    { key: "x_url", label: "X" },
    { key: "youtube_url", label: "YouTube" },
    { key: "github_url", label: "GitHub" },
  ] as const).flatMap((item) => {
    const href = profile[item.key];
    return href ? [{ key: item.key, label: item.label, href }] : [];
  });
  const hasNoActivity = (totalAnswerCount ?? 0) === 0 && (examAnswers ?? []).length === 0 && achievementRows.length === 0;
  const navItems = [
    { href: "#overview", label: "概要" },
    { href: "#thought-log", label: "思考ログ" },
    { href: "#competitive", label: "戦績" },
    { href: "#achievements", label: "実績" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-3 py-4 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-8 sm:pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:py-10">
      <section id="overview" className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr] lg:items-start lg:gap-5">
        <div className="space-y-4 lg:sticky lg:top-24">
          <Card className="p-0">
            <div className="relative overflow-hidden p-4 sm:p-6 lg:p-7">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-300/14 blur-3xl" />
              <div className="pointer-events-none absolute left-6 top-0 h-px w-2/3 bg-gradient-to-r from-amber-200/80 via-white/20 to-transparent" />
              {saved === "profile" ? <div className="relative mb-4 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-100">プロフィールを保存しました。</div> : null}

              <div className="relative flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <Avatar profile={profile} />
                  <div className="min-w-0">
                    <p className="text-[0.64rem] font-black uppercase tracking-[0.24em] text-league-gold">Profile</p>
                    <h1 className="mt-1 truncate text-[1.8rem] font-black leading-tight text-white sm:text-4xl">{profile.display_name ?? profile.username}</h1>
                    <p className="mt-1 truncate text-sm font-bold text-league-muted">@{profile.username}</p>
                  </div>
                </div>

                {isOwnProfile ? (
                  <div className="flex shrink-0 gap-1.5">
                    <Link href="/profile/edit" className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10 text-sm font-black text-league-gold transition hover:bg-amber-300/20 hover:text-white" aria-label="プロフィールを編集">✎</Link>
                    <Link href="/settings#profile-display" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm font-black text-white transition hover:border-amber-300/30 hover:bg-white/[0.1]" aria-label="プロフィール表示を変更">⚙</Link>
                  </div>
                ) : null}
              </div>

              <p className="relative mt-4 text-sm leading-7 text-league-silver">{profile.bio ?? "自己紹介はまだありません。"}</p>

              <div className="relative mt-4 grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl border border-amber-300/25 bg-black/25 px-3 py-3">
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-league-muted">Current Rank</p>
                  <p className="mt-1 text-lg font-black text-league-gold">{profile.rank}</p>
                </div>
                <div className="rounded-2xl border border-amber-300/20 bg-black/25 px-3 py-3">
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-league-muted">Rating</p>
                  <p className="mt-1 text-lg font-black text-white">{profile.rating}</p>
                </div>
                <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-3">
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-league-muted">称号 / Archetype</p>
                  <p className="mt-1 line-clamp-2 text-sm font-black leading-5 text-white">{selectedTitle?.label ?? (profile.archetype ? `${archetype?.ja ?? profile.archetype} / ${profile.archetype}` : "未分類")}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="text-center">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.28em] text-league-gold">Rank Showcase</p>
            <div className="mt-3 flex justify-center">
              <RankBadge rank={profile.rank} size="profile" showLabel labelPlacement="bottom" />
            </div>
            <div className="mt-4 rounded-[1.25rem] border border-amber-300/20 bg-black/25 p-4 text-left">
              <RankProgress rating={profile.rating} qualified={profile.qualified} compact className="relative" />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[0.65rem] font-black uppercase tracking-[0.24em] text-league-gold">Stats</p>
                <h2 className="mt-1 text-xl font-black text-white">プロフィール統計</h2>
              </div>
              <PremiumBadge tone={profile.qualified ? "emerald" : "silver"}>{profile.qualified ? "認定済み" : "未認定"}</PremiumBadge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
              <ProfileMiniStat label="Rating" value={profile.rating} tone="gold" />
              <ProfileMiniStat label="思考偏差値" value={formatDeviation(selectedDeviation)} tone="gold" />
              <ProfileMiniStat label="Competitive参加" value={competitiveCount ?? 0} tone={profile.qualified ? "emerald" : "silver"} />
              <ProfileMiniStat label="Top10" value={top10Count ?? 0} />
              <ProfileMiniStat label="総回答数" value={totalAnswerCount ?? 0} />
              <ProfileMiniStat label="登録日" value={registeredAt} />
            </div>
            <div className="mt-4 rounded-[1.15rem] border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-league-muted">表示中の思考偏差値</p>
                  <p className="mt-1 text-lg font-black text-white">{deviationTypeLabel(selectedDeviationType)}</p>
                </div>
                <p className="text-right text-xs leading-5 text-league-muted">{deviationSourceLabel}</p>
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeader eyebrow="Activity" title="思考ログ" action={<Link href="#thought-log" className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-xs font-black text-league-gold transition hover:bg-amber-300/20 hover:text-white">すべて見る</Link>} />
            {showThoughtLog ? (
              <div className="mt-4 space-y-2.5">
                {topicItems.slice(0, 4).map((item) => (
                  <Link key={item.id} href={item.activityHref ?? discussionHref(item)} className="block rounded-[1.15rem] border border-white/10 bg-black/25 p-3 transition hover:border-amber-300/35 hover:bg-white/[0.06]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-0.5 text-[0.62rem] font-black text-league-gold">{answerTypeLabel(item.answer_type)}</span>
                        <p className="min-w-0 truncate text-sm font-black text-white">{item.activityLabel ?? item.title}</p>
                      </div>
                      <time className="shrink-0 text-[0.62rem] font-bold text-league-muted">{formatDateTime(item.created_at)}</time>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-league-silver">{createPreview(item.content, 110)}</p>
                  </Link>
                ))}
                {topicItems.length === 0 ? <EmptyState kind="timeline" title="思考ログはまだありません。">公開回答が投稿されるとここに表示されます。</EmptyState> : null}
              </div>
            ) : <VisibilityEmpty title="思考ログは非公開です。">このユーザーは回答履歴の公開をオフにしています。</VisibilityEmpty>}
          </Card>
        </div>
      </section>

      <nav className="sticky top-0 z-10 -mx-4 mt-4 overflow-x-auto border-y border-white/10 bg-league-black/85 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-3" aria-label="Profile sections">
        <div className="flex min-w-max gap-2">
          {navItems.map((item) => <Link key={item.href} href={item.href} className="rounded-full px-4 py-2 text-sm font-black text-league-silver transition hover:bg-white/[0.06] hover:text-league-gold">{item.label}</Link>)}
        </div>
      </nav>

      {isOwnProfile ? (
        <section className="mt-5">
          <Card>
            <SectionHeader eyebrow="My Page" title="マイページ" />
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-league-gold">Current Deviation</p>
                <p className="mt-2 text-3xl font-black text-white">{formatDeviation(selectedDeviation)}</p>
                <p className="mt-1 text-xs text-league-muted">{deviationTypeLabel(selectedDeviationType)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-league-muted">Weekly trend</p>
                <p className={`mt-2 text-3xl font-black ${weeklyTrend == null ? "text-white" : weeklyTrend >= 0 ? "text-emerald-200" : "text-red-200"}`}>{weeklyTrend == null ? "—" : `${weeklyTrend >= 0 ? "+" : ""}${weeklyTrend.toFixed(1)}`}</p>
                <p className="mt-1 text-xs text-league-muted">前回Weekly比</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-league-muted">Next goal</p>
                <p className="mt-2 text-lg font-black text-white">{nextDeviationGoal}</p>
                <p className="mt-1 text-xs text-league-muted">次のCompetitive Discussionで更新</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { href: "/profile", label: "プロフィール", description: "個人ページ" },
                { href: "/achievements", label: "実績", description: "獲得バッジ" },
                { href: "/bookmarks", label: "ブックマーク", description: "保存項目" },
                { href: "/notifications", label: "通知", description: "更新確認" },
                { href: "/settings", label: "設定", description: "公開範囲" },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-amber-300/35 hover:bg-white/[0.06]">
                  <span className="block text-base font-black text-white">{item.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-league-muted">{item.description}</span>
                </Link>
              ))}
            </div>
          </Card>
        </section>
      ) : null}

      {hasNoActivity ? <section className="mt-5"><ProfileStartEmptyState isOwnProfile={isOwnProfile} /></section> : null}

      <section className="mt-5 grid gap-4 lg:gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <SectionHeader eyebrow="代表回答" title="この人の思考が一番伝わる回答" />
          {showThoughtLog && featuredAnswer ? (
            <Link href={discussionHref(featuredAnswer)} className="mt-4 block rounded-[1.5rem] border border-amber-300/20 bg-[linear-gradient(145deg,rgba(215,180,106,0.12),rgba(255,255,255,0.035))] p-4 transition hover:border-amber-300/45 hover:bg-amber-300/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <PremiumBadge>{formatDiscussionType(featuredAnswer.topicType)}</PremiumBadge>
                <span className="text-xs font-bold text-league-muted">{formatDateTime(featuredAnswer.created_at)}</span>
              </div>
              <h2 className="mt-3 line-clamp-2 text-xl font-black text-white">{featuredAnswer.title}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-league-silver">{createPreview(featuredAnswer.content, 260)}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-league-muted">
                <span>種別 {answerTypeLabel(featuredAnswer.answer_type)}</span>
                {featuredAnswer.score !== null ? <span>Score {featuredAnswer.score}</span> : null}
                <span>いいね {featuredAnswer.likeCount}</span>
                <span>コメント {featuredAnswer.commentCount}</span>
              </div>
            </Link>
          ) : showThoughtLog ? <EmptyState kind="timeline" title="代表回答はまだありません。">公開回答が投稿されると、スコアまたはいいね数から自動で選ばれます。</EmptyState> : <VisibilityEmpty title="代表回答は非公開です。">思考ログの公開設定がオフのため表示していません。</VisibilityEmpty>}
        </Card>

        <Card>
          <SectionHeader eyebrow="Archetype" title="思考タイプ" />
          {showExam ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                <p className="text-2xl font-black text-white">{archetype ? `${archetype.ja} / ${profile.archetype}` : "未分類"}</p>
                <p className="mt-3 text-sm leading-7 text-league-silver">{archetype?.description ?? "認定試験を受験すると、思考の傾向が表示されます。"}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ProfileField label="Strengths" value={latestExam?.strength ?? archetype?.strength ?? "—"} />
                <ProfileField label="Weaknesses" value={latestExam?.weakness ?? archetype?.weakness ?? "—"} />
              </div>
            </div>
          ) : <VisibilityEmpty title="思考タイプは非公開です。">認定試験結果の公開設定がオフのため表示していません。</VisibilityEmpty>}
        </Card>
      </section>

      <section id="thought-log" className="scroll-mt-24 mt-5">
        <Card>
          <SectionHeader eyebrow="Thought Log" title="思考ログ">
            回答・反論・補足・質問を時系列で表示します。数秒で「何を考える人なのか」を掴める公開ポートフォリオです。
          </SectionHeader>
          {showThoughtLog ? (
            <div className="mt-4 space-y-3">
              {topicItems.slice(0, 14).map((item) => (
                <Link key={item.id} href={item.activityHref ?? discussionHref(item)} className="block rounded-[1.35rem] border border-white/10 bg-black/20 p-4 transition hover:border-amber-300/35 hover:bg-white/[0.06]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      <PremiumBadge>{answerTypeLabel(item.answer_type)}</PremiumBadge>
                      <PremiumBadge tone="silver">{formatDiscussionType(item.topicType)}</PremiumBadge>
                    </div>
                    <time className="text-xs font-bold text-league-muted">{formatDateTime(item.created_at)}</time>
                  </div>
                  <h3 className="mt-3 line-clamp-1 text-base font-black text-white sm:text-lg">{item.activityLabel ?? item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-league-silver">{createPreview(item.content, 190)}</p>
                </Link>
              ))}
              {topicItems.length === 0 ? <EmptyState kind="timeline" title="思考ログはまだありません。">公開回答が投稿されるとここに時系列で表示されます。</EmptyState> : null}
            </div>
          ) : <VisibilityEmpty title="思考ログは非公開です。">このユーザーは回答履歴の公開をオフにしています。</VisibilityEmpty>}
        </Card>
      </section>

      <section id="competitive" className="scroll-mt-24 mt-5 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <SectionHeader eyebrow="Competitive Record" title="戦績" />
          {showCompetitive ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Competitive参加回数" value={competitiveCount ?? 0} tone="gold" />
              <StatCard label="Top10回数" value={top10Count ?? 0} />
              <StatCard label="優勝回数" value={winCount ?? 0} tone="emerald" />
              <StatCard label="Hall of Fame回数" value={hallOfFameCount ?? 0} tone="gold" />
              <StatCard label="Current Rank" value={profile.rank} />
              <StatCard label="Highest Rank" value={highestRank} />
              <StatCard label="Highest Rating" value={highestRating} tone="gold" />
            </div>
          ) : <VisibilityEmpty title="戦績は非公開です。">Competitive履歴の公開設定がオフのため表示していません。</VisibilityEmpty>}
        </Card>
        <Card>
          <SectionHeader eyebrow="Rating History" title="Rating変動" />
          {showCompetitive ? (
            <div className="mt-4 space-y-3">
              {ratingRows.slice(0, 5).map((history, index) => {
                const topic = first(history.topics);
                return (
                  <div key={`${history.created_at}-${index}`} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-bold text-white">{topic?.title ?? "競技議論"}</p>
                      <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">{(history.delta ?? 0) >= 0 ? "+" : ""}{history.delta ?? 0}</span>
                    </div>
                    <p className="mt-2 text-xs text-league-muted">{history.old_rating ?? 0} → {history.new_rating ?? 0} · {formatDateTime(history.created_at)}</p>
                  </div>
                );
              })}
              {ratingRows.length === 0 ? <EmptyState kind="timeline" title="Rating変動はまだありません。">競技議論完了後にRating変動が保存されます。</EmptyState> : null}
            </div>
          ) : <VisibilityEmpty title="Rating変動は非公開です。">Competitive履歴の公開設定がオフのため表示していません。</VisibilityEmpty>}
        </Card>
      </section>

      <section id="achievements" className="scroll-mt-24 mt-5">
        <Card>
          <SectionHeader eyebrow="Achievement Showcase" title="実績ショーケース" action={<Link href="/achievements" className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-black text-league-gold transition hover:bg-amber-300/20 hover:text-white">すべて見る</Link>}>
            最近の実績、獲得済み、未獲得の目標をプレミアムバッジとして表示します。
          </SectionHeader>
          {showAchievements ? (
            <div className="mt-5 space-y-5">
              <div>
                <h3 className="text-sm font-black text-white">Recent achievements</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(recentAchievements.length > 0 ? recentAchievements : unlockedAchievements.slice(0, 1)).map((achievement) => (
                    <div key={achievement.key} className="rounded-2xl border border-amber-300/30 bg-[radial-gradient(circle_at_top_right,rgba(215,180,106,0.18),transparent_40%),rgba(215,180,106,0.08)] p-4 shadow-[0_18px_60px_rgba(215,180,106,0.08)]">
                      <AchievementBadge label={achievement.badgeIcon} unlocked size="sm" />
                      <p className="mt-3 font-black text-white">{achievement.title}</p>
                      <p className="mt-1 text-xs leading-5 text-league-muted">{achievement.description}</p>
                    </div>
                  ))}
                  {unlockedAchievements.length === 0 ? <EmptyState kind="achievements" title="最近の実績はまだありません。">回答やCompetitive参加で解除されます。</EmptyState> : null}
                </div>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-black text-white">Unlocked achievements</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {unlockedAchievements.slice(0, 6).map((achievement) => (
                      <div key={achievement.key} className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4">
                        <div className="flex items-start gap-3">
                          <AchievementBadge label={achievement.badgeIcon} unlocked size="sm" />
                          <span><span className="block font-black text-white">{achievement.title}</span><span className="mt-1 block text-xs leading-5 text-league-muted">獲得日: {formatDateTime(achievement.row?.unlocked_at ?? achievement.row?.created_at ?? null)}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Locked achievements</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {lockedAchievements.slice(0, 6).map((achievement) => (
                      <div key={achievement.key} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 opacity-75 grayscale">
                        <div className="flex items-start gap-3">
                          <AchievementBadge label={achievement.badgeIcon} unlocked={false} size="sm" />
                          <span><span className="block font-black text-white">{achievement.title}</span><span className="mt-1 block text-xs leading-5 text-league-muted">{achievement.description}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-2xl font-black">{earnedAchievementKeys.size}</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-league-muted">獲得</p></div>
                <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-2xl font-black">{achievementDefinitions.length - earnedAchievementKeys.size}</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-league-muted">未獲得</p></div>
                <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-2xl font-black">{Math.round((earnedAchievementKeys.size / achievementDefinitions.length) * 100)}%</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-league-muted">進捗</p></div>
              </div>
            </div>
          ) : <VisibilityEmpty title="実績は非公開です。">実績の公開設定がオフのため表示していません。</VisibilityEmpty>}
        </Card>
      </section>

      <section className="mt-5 grid gap-4 lg:gap-5 lg:grid-cols-2">
        <Card>
          <SectionHeader eyebrow="Links" title="外部リンク" />
          {availableSnsLinks.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {availableSnsLinks.map((link) => <Link key={link.key} href={link.href} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white transition hover:border-amber-300/40 hover:text-league-gold">{link.label}</Link>)}
            </div>
          ) : <EmptyState title="SNSリンクは未設定です。">プロフィール編集からX、YouTube、GitHubのリンクを追加できます。</EmptyState>}
        </Card>
        <Card>
          <SectionHeader eyebrow="Intent" title="この人は何を考える人なのか" />
          <p className="mt-4 text-sm leading-7 text-league-silver">
            {latestExam?.summary ?? archetype?.description ?? "代表回答、思考ログ、戦績、実績から、議論への向き合い方が見えるようになります。"}
          </p>
        </Card>
      </section>
    </main>
  );
}
