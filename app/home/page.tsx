import Link from "next/link";
import { RankBadge } from "@/components/rank/RankBadge";
import { RankProgress } from "@/components/rank/RankProgress";
import { TopicCard } from "@/components/topics/TopicCard";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createPreview, formatDateTime, formatDiscussionType, formatTopicCategory } from "@/lib/topics/format";
import { getWeeklyCtaLabel, getWeeklyPhase, getWeeklyStatusLabel } from "@/lib/weekly";
import type { Comment, Like, TopicAnswer } from "@/types/database";
import type { Profile } from "@/types/logic-league";

type HomeTopic = {
  id: string;
  category: string;
  title: string;
  content: string;
  publish_at: string | null;
  type?: string | null;
  answerCount: number;
  commentCount: number;
};

type LeaderWidgetProfile = Pick<Profile, "id" | "username" | "display_name" | "rank" | "rating">;
type LatestFameWidget = { id: string; final_score: number | null; profiles?: { username?: string | null; display_name?: string | null; rank?: string | null } | { username?: string | null; display_name?: string | null; rank?: string | null }[] | null; topics?: { title?: string | null } | { title?: string | null }[] | null };

type FeedAnswer = Pick<TopicAnswer, "id" | "topic_id" | "user_id" | "answer_type" | "content" | "created_at"> & {
  topics?: { category?: string | null; title?: string | null } | { category?: string | null; title?: string | null }[] | null;
  profile?: Pick<Profile, "id" | "display_name" | "username" | "rank">;
  likeCount: number;
  commentCount: number;
};

function displayName(profile?: Pick<Profile, "display_name" | "username">) {
  return profile?.display_name || profile?.username || "Logic Leagueユーザー";
}

function profileHref(profile?: Pick<Profile, "id" | "username">) {
  return profile?.username ? `/profile/${profile.username}` : `/profile/${profile?.id ?? "unknown"}`;
}

function activityLabel(answerType: TopicAnswer["answer_type"]) {
  switch (answerType) {
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

function topicOf(answer: FeedAnswer) {
  return Array.isArray(answer.topics) ? answer.topics[0] : answer.topics;
}

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function DiscussionOnboardingEmptyState() {
  const discussionTypes = [
    { title: "Daily Discussionとは？", body: "日々の問いに回答し、反論・質問・補足で議論を育てる公開ディスカッションです。", href: "/topics", cta: "Dailyを見る" },
    { title: "Competitive Discussionとは？", body: "期限内に回答し、AI評価と投票を通じてRating・Rank・Hall of Fameを目指す競技議論です。", href: "/weekly", cta: "Competitiveを見る" },
  ];
  return (
    <Card className="border-dashed border-amber-300/25 bg-[radial-gradient(circle_at_top_right,rgba(215,180,106,0.12),transparent_32%),rgba(255,255,255,0.035)] p-5 sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-league-gold">Start here</p>
      <h3 className="mt-2 text-2xl font-black text-white">最初の議論に参加しましょう</h3>
      <p className="mt-3 text-sm leading-7 text-league-silver">公開中の議論が少ない時期でも、参加の入口は明確です。認定試験で現在地を知り、DailyまたはCompetitiveに参加しましょう。</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {discussionTypes.map((item) => (
          <div key={item.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <h4 className="font-black text-white">{item.title}</h4>
            <p className="mt-2 text-sm leading-6 text-league-muted">{item.body}</p>
            <Link href={item.href} className="mt-4 inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-black text-league-gold transition hover:bg-amber-300/20 hover:text-white">{item.cta}</Link>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <ButtonLink href="/exam" className="px-4 py-2 text-sm">認定試験を受験</ButtonLink>
        <ButtonLink href="/timeline" className="bg-none bg-white/10 px-4 py-2 text-sm text-white shadow-none ring-1 ring-white/15">Timelineの仕組みを見る</ButtonLink>
      </div>
    </Card>
  );
}

function NewUserJourney() {
  const steps = ["Home", "認定試験", "初めての議論", "実績解除", "Timeline掲載"];
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">Onboarding</p>
      <h2 className="mt-1 text-xl font-black text-white">Logic Leagueの始め方</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-5">
        {steps.map((step, index) => (
          <div key={step} className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-league-muted">Step {index + 1}</p>
            <p className="mt-1 text-sm font-black text-white">{step}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
    : { data: null };

  const competitionClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;
  const [{ data: latestTopics }, { data: weeklyTopics }, { data: latestAnswers }, { count: answerCount }, { data: leaderProfiles }, { count: oracleCount }, { data: latestFame }] = await Promise.all([
    supabase
      .from("topics")
      .select("id, type, category, title, content, publish_at")
      .eq("type", "daily")
      .eq("status", "published")
      .order("publish_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("topics")
      .select("id, type, category, title, content, deadline_at, vote_deadline_at, publish_at")
      .eq("type", "weekly")
      .eq("status", "published")
      .order("publish_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("topic_answers")
      .select("id, topic_id, user_id, answer_type, content, created_at, topics!inner(category, title, type)")
      .eq("topics.type", "daily")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("topic_answers")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user?.id ?? ""),
    competitionClient
      .from("profiles")
      .select("id, username, display_name, rank, rating")
      .order("rating", { ascending: false })
      .limit(3),
    competitionClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("rank", "Oracle"),
    competitionClient
      .from("hall_of_fame")
      .select("id, final_score, profiles:profiles!hall_of_fame_winner_user_id_fkey(username, display_name, rank), topics(title)")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const topicRows = latestTopics ?? [];
  const topicIds = topicRows.map((topic) => topic.id);
  const answerRows = (latestAnswers ?? []) as FeedAnswer[];
  const answerIds = answerRows.map((answer) => answer.id);

  const [{ data: topicAnswerCounts }, { data: topicComments }, { data: feedLikes }, { data: feedComments }] = await Promise.all([
    topicIds.length > 0 ? supabase.from("topic_answers").select("id, topic_id").in("topic_id", topicIds) : Promise.resolve({ data: [] as Pick<TopicAnswer, "id" | "topic_id">[] }),
    topicIds.length > 0 ? supabase.from("comments").select("topic_answer_id, topic_answers!inner(topic_id)").in("topic_answers.topic_id", topicIds) : Promise.resolve({ data: [] as unknown[] }),
    answerIds.length > 0 ? supabase.from("likes").select("topic_answer_id").in("topic_answer_id", answerIds) : Promise.resolve({ data: [] as Pick<Like, "topic_answer_id">[] }),
    answerIds.length > 0 ? supabase.from("comments").select("topic_answer_id").in("topic_answer_id", answerIds) : Promise.resolve({ data: [] as Pick<Comment, "topic_answer_id">[] }),
  ]);

  const answerCountsByTopic = new Map<string, number>();
  for (const row of topicAnswerCounts ?? []) answerCountsByTopic.set(row.topic_id, (answerCountsByTopic.get(row.topic_id) ?? 0) + 1);

  const commentCountsByTopic = new Map<string, number>();
  for (const row of (topicComments ?? []) as { topic_answers?: { topic_id?: string | null } | { topic_id?: string | null }[] | null }[]) {
    const answerTopic = Array.isArray(row.topic_answers) ? row.topic_answers[0] : row.topic_answers;
    if (answerTopic?.topic_id) commentCountsByTopic.set(answerTopic.topic_id, (commentCountsByTopic.get(answerTopic.topic_id) ?? 0) + 1);
  }

  const likeCountsByAnswer = new Map<string, number>();
  for (const like of feedLikes ?? []) likeCountsByAnswer.set(like.topic_answer_id, (likeCountsByAnswer.get(like.topic_answer_id) ?? 0) + 1);
  const commentCountsByAnswer = new Map<string, number>();
  for (const comment of feedComments ?? []) commentCountsByAnswer.set(comment.topic_answer_id, (commentCountsByAnswer.get(comment.topic_answer_id) ?? 0) + 1);

  const userIds = Array.from(new Set(answerRows.map((answer) => answer.user_id)));
  const profileClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;
  const { data: answerProfiles } = userIds.length > 0
    ? await profileClient.from("profiles").select("id, display_name, username, rank").in("id", userIds)
    : { data: [] as Pick<Profile, "id" | "display_name" | "username" | "rank">[] };
  const profilesById = new Map((answerProfiles ?? []).map((answerProfile) => [answerProfile.id, answerProfile]));

  const topics: HomeTopic[] = topicRows.map((topic) => ({
    ...topic,
    answerCount: answerCountsByTopic.get(topic.id) ?? 0,
    commentCount: commentCountsByTopic.get(topic.id) ?? 0,
  }));
  const todaysTopic = topics[0];
  const trendingTopics = [...topics].sort((a, b) => (b.answerCount + b.commentCount) - (a.answerCount + a.commentCount)).slice(0, 5);
  const feedAnswers: FeedAnswer[] = answerRows.map((answer) => ({
    ...answer,
    profile: profilesById.get(answer.user_id),
    likeCount: likeCountsByAnswer.get(answer.id) ?? 0,
    commentCount: commentCountsByAnswer.get(answer.id) ?? 0,
  }));
  const activeWeeklyTopic = (weeklyTopics ?? []).find((topic) => ["submission", "voting"].includes(getWeeklyPhase(topic))) ?? (weeklyTopics ?? [])[0];
  const activeWeeklyPhase = activeWeeklyTopic ? getWeeklyPhase(activeWeeklyTopic) : null;
  const activeWeeklyHref = activeWeeklyTopic
    ? activeWeeklyPhase === "completed" ? `/weekly/${activeWeeklyTopic.id}/results` : `/weekly/${activeWeeklyTopic.id}`
    : "/weekly";
  const latestFameRow = ((latestFame ?? []) as LatestFameWidget[])[0];
  const latestFameProfile = first(latestFameRow?.profiles);
  const latestFameTopic = first(latestFameRow?.topics);
  const discussionCount = topicRows.length + ((weeklyTopics ?? []).length);
  const discussionsAreScarce = discussionCount < 2;

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:py-12">
      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr] lg:gap-6">
        <Card className="overflow-hidden border-amber-300/20 bg-[radial-gradient(circle_at_top_right,rgba(215,180,106,0.16),transparent_30%),linear-gradient(145deg,rgba(255,255,255,0.07),rgba(8,13,26,0.76))] p-5 sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.34em] text-league-gold">議論コマンド</p>
              <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">今、どの議論に参加するか</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-league-silver sm:text-base">公開中の議論から論点を選び、回答・反論・補足で知的リーグを動かしましょう。</p>
            </div>
            <ButtonLink href={todaysTopic ? `/topics/${todaysTopic.id}` : "/topics"} className="shrink-0 px-5 py-3">議論に参加する</ButtonLink>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          {profile ? (<>
          <div className="flex items-center gap-3">
            <RankBadge rank={profile.rank} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">{profile.display_name ?? profile.username}</p>
              <p className="truncate text-xs text-league-muted">@{profile.username}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3"><p className="text-xs text-league-muted">Rank</p><p className="mt-1 font-black text-league-gold">{profile.rank}</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-3"><p className="text-xs text-league-muted">Rating</p><p className="mt-1 font-black">{profile.rating}</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-3"><p className="text-xs text-league-muted">回答</p><p className="mt-1 font-black">{answerCount ?? 0}</p></div>
          </div>
          <RankProgress rating={profile.rating} qualified={profile.qualified} compact className="mt-4" />
          </>) : (
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">Visitor</p>
              <h2 className="mt-2 text-xl font-black text-white">ログインすると成長が記録されます</h2>
              <p className="mt-3 text-sm leading-6 text-league-muted">読むことは誰でも可能です。回答・投票・いいねにはログインが必要です。</p>
              <Link href="/login" className="mt-4 inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-black text-league-gold">ログインする</Link>
            </div>
          )}
        </Card>
      </section>

      <section className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-3">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">Leaderboard</p><h2 className="mt-1 text-xl font-black">Top 3</h2></div>
            <Link href="/leaderboard" className="text-xs font-bold text-league-gold hover:text-white">全体を見る</Link>
          </div>
          <div className="mt-4 space-y-3">
            {((leaderProfiles ?? []) as LeaderWidgetProfile[]).length < 3 ? <p className="text-sm leading-6 text-league-muted">ランキングは参加者が増えると表示されます。Ratingは認定試験と競技議論の結果から更新されます。</p> : ((leaderProfiles ?? []) as LeaderWidgetProfile[]).map((leader, index) => (
              <Link key={leader.id} href={`/profile/${leader.username}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 transition hover:border-amber-300/35">
                <span className="w-7 text-lg font-black text-league-gold">#{index + 1}</span>
                <RankBadge rank={leader.rank} size="xs" />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-white">{leader.display_name ?? leader.username}</span><span className="block text-xs text-league-muted">Rating {leader.rating}</span></span>
              </Link>
            ))}
          </div>
        </Card>
        <Card className="p-4 sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">Oracle</p>
          <h2 className="mt-1 text-xl font-black">現在のOracle数</h2>
          <p className="mt-5 text-5xl font-black text-league-gold">{oracleCount ?? 0}</p>
          <p className="mt-3 text-sm leading-6 text-league-muted">Rating 2500以上の最高Rank到達者です。</p>
          <Link href="/oracle" className="mt-4 inline-block text-sm font-bold text-league-gold hover:text-white">Oracle一覧を見る →</Link>
        </Card>
        <Card className="p-4 sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">Hall of Fame</p>
          <h2 className="mt-1 text-xl font-black">最新の勝者</h2>
          {latestFameRow ? (
            <Link href={`/hall-of-fame/${latestFameRow.id}`} className="mt-4 block rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 transition hover:border-amber-300/45">
              <p className="text-sm font-black text-white">{latestFameProfile?.display_name ?? latestFameProfile?.username ?? "Winner"}</p>
              <p className="mt-1 text-xs text-league-muted">{latestFameTopic?.title ?? "競技議論"}</p>
              <p className="mt-3 text-2xl font-black text-league-gold">{latestFameRow.final_score ?? "—"}</p>
            </Link>
          ) : <p className="mt-4 text-sm leading-6 text-league-muted">最初の競技議論勝者を待っています。</p>}
        </Card>
      </section>


      <section className="mt-5 grid gap-5 lg:mt-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">今日の注目議論</p>
              <h2 className="mt-1 text-2xl font-black sm:text-3xl">今日、参加すべき議論</h2>
            </div>
            <Link href="/topics" className="text-sm font-bold text-league-gold hover:text-white">議論一覧 →</Link>
          </div>
          {todaysTopic ? (
            <div className="space-y-3">
              <TopicCard topic={todaysTopic} featured />
              <div className="grid grid-cols-2 gap-3 text-sm font-bold text-league-silver">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-3">回答 {todaysTopic.answerCount}</div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-3">コメント {todaysTopic.commentCount}</div>
              </div>
            </div>
          ) : <DiscussionOnboardingEmptyState />}
        </div>

        <Card className="p-4 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">おすすめ議論</p>
          <h2 className="mt-2 text-2xl font-black">活動量の高い議論</h2>
          <div className="mt-5 space-y-3">
            {trendingTopics.map((topic, index) => (
              <Link key={topic.id} href={`/topics/${topic.id}`} className="group block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-amber-300/35 hover:bg-white/[0.06]">
                <div className="flex items-start gap-3">
                  <span className="text-2xl font-black text-white/20">0{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold uppercase tracking-[0.2em] text-league-gold">{formatDiscussionType(topic.type)}</span>
                    <span className="mt-1 block font-black leading-snug group-hover:text-league-gold">{topic.title}</span>
                    <span className="mt-2 block text-xs text-league-muted">回答 {topic.answerCount} · コメント {topic.commentCount}</span>
                  </span>
                </div>
              </Link>
            ))}
            {trendingTopics.length === 0 ? <p className="text-sm leading-6 text-league-muted">新しい議論が公開されると、ここに表示されます。参加可能な議論はDailyまたはCompetitiveから確認できます。</p> : null}
          </div>
        </Card>
      </section>

      {discussionsAreScarce ? <section className="mt-5 lg:mt-6"><NewUserJourney /></section> : null}

      {activeWeeklyTopic ? (
        <section className="mt-5 lg:mt-8">
          <Card className="overflow-hidden border-amber-300/20 bg-[radial-gradient(circle_at_top_right,rgba(215,180,106,0.12),transparent_28%),linear-gradient(145deg,rgba(255,255,255,0.06),rgba(8,13,26,0.74))] p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">競技議論</p>
                <h2 className="mt-2 text-xl font-black sm:text-3xl">{activeWeeklyTopic.title}</h2>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-league-silver sm:text-sm">
                  <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5">現在の段階: {activeWeeklyPhase ? getWeeklyStatusLabel(activeWeeklyPhase) : "開始前"}</span>
                  <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5">締切: {formatDateTime(activeWeeklyTopic.deadline_at)}</span>
                </div>
              </div>
              <ButtonLink href={activeWeeklyHref} className="px-4 py-2 text-xs sm:px-6 sm:py-3 sm:text-sm">{activeWeeklyPhase ? getWeeklyCtaLabel(activeWeeklyPhase) : "競技議論に参加する"}</ButtonLink>
            </div>
          </Card>
        </section>
      ) : null}

      <section className="mt-6 lg:mt-10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">最近動いている議論</p>
            <h2 className="mt-1 text-2xl font-black sm:mt-2 sm:text-3xl">いま動いている議論</h2>
          </div>
          <ButtonLink href="/timeline" className="bg-none bg-white/10 text-white shadow-none ring-1 ring-white/15 hover:bg-white/15">タイムラインを見る</ButtonLink>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {feedAnswers.slice(0, 6).map((answer) => {
            const topic = topicOf(answer);
            return (
              <article key={answer.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4 transition duration-300 hover:-translate-y-1 hover:border-amber-300/35 hover:bg-white/[0.07] sm:rounded-[1.5rem] sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <Link href={profileHref(answer.profile)} className="flex min-w-0 items-center gap-3 rounded-xl transition hover:text-league-gold">
                    <RankBadge rank={answer.profile?.rank} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate font-black">{displayName(answer.profile)}</span>
                      <span className="block truncate text-xs text-league-muted">@{answer.profile?.username ?? answer.user_id}</span>
                    </span>
                  </Link>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-league-silver">{activityLabel(answer.answer_type)}</span>
                </div>
                <Link href={`/topics/${answer.topic_id}`} className="mt-4 block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-amber-300/30">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-league-gold">{formatTopicCategory(topic?.category)}</p>
                  <h3 className="mt-2 font-black leading-snug text-white">{topic?.title ?? "議論"}</h3>
                  <p className="mt-3 text-sm leading-7 text-league-silver">{createPreview(answer.content, 160)}</p>
                  <p className="mt-3 text-xs text-league-muted">{formatDateTime(answer.created_at)} · いいね {answer.likeCount} · コメント {answer.commentCount}</p>
                </Link>
              </article>
            );
          })}
        </div>
        {feedAnswers.length === 0 ? <DiscussionOnboardingEmptyState /> : null}
      </section>
    </main>
  );
}
