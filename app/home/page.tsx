import Link from "next/link";
import { redirect } from "next/navigation";
import { RankBadge } from "@/components/rank/RankBadge";
import { TopicCard } from "@/components/topics/TopicCard";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createPreview, formatDateTime } from "@/lib/topics/format";
import { getWeeklyPhase, getWeeklyStatusLabel } from "@/lib/weekly";
import type { Comment, Like, TopicAnswer } from "@/types/database";
import type { Profile } from "@/types/logic-league";

type HomeTopic = {
  id: string;
  category: string;
  title: string;
  content: string;
  publish_at: string | null;
  answerCount: number;
  commentCount: number;
};

type FeedAnswer = Pick<TopicAnswer, "id" | "topic_id" | "user_id" | "answer_type" | "content" | "created_at"> & {
  topics?: { category?: string | null; title?: string | null } | { category?: string | null; title?: string | null }[] | null;
  profile?: Pick<Profile, "id" | "display_name" | "username" | "rank">;
  likeCount: number;
  commentCount: number;
};

function displayName(profile?: Pick<Profile, "display_name" | "username">) {
  return profile?.display_name || profile?.username || "Logic Player";
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

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile?.predicted_deviation) redirect("/exam");

  const [{ data: latestTopics }, { data: weeklyTopics }, { data: latestAnswers }, { count: answerCount }] = await Promise.all([
    supabase
      .from("topics")
      .select("id, category, title, content, publish_at")
      .eq("type", "daily")
      .eq("status", "published")
      .order("publish_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("topics")
      .select("id, category, title, content, deadline_at, vote_deadline_at, publish_at")
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
      .eq("user_id", user.id),
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

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:py-12">
      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr] lg:gap-6">
        <Card className="overflow-hidden border-amber-300/20 bg-[radial-gradient(circle_at_top_right,rgba(215,180,106,0.16),transparent_30%),linear-gradient(145deg,rgba(255,255,255,0.07),rgba(8,13,26,0.76))] p-5 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.34em] text-league-gold">Discussion Command</p>
              <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight sm:text-5xl lg:text-6xl">今、どの議論に参加するか</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-league-silver sm:text-base">Active Topicsから論点を選び、回答・反論・補足で知的リーグを動かしましょう。</p>
            </div>
            <ButtonLink href={todaysTopic ? `/topics/${todaysTopic.id}` : "/topics"} className="shrink-0 px-5 py-3">議論に参加する</ButtonLink>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
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
            <div className="rounded-2xl border border-white/10 bg-black/25 p-3"><p className="text-xs text-league-muted">Answer</p><p className="mt-1 font-black">{answerCount ?? 0}</p></div>
          </div>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 lg:mt-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">今日のTopic</p>
              <h2 className="mt-1 text-2xl font-black sm:text-3xl">最新の論点へ入る</h2>
            </div>
            <Link href="/topics" className="text-sm font-bold text-league-gold hover:text-white">Topics →</Link>
          </div>
          {todaysTopic ? (
            <div className="space-y-3">
              <TopicCard topic={todaysTopic} featured />
              <div className="grid grid-cols-2 gap-3 text-sm font-bold text-league-silver">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-3">回答 {todaysTopic.answerCount}</div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-3">コメント {todaysTopic.commentCount}</div>
              </div>
            </div>
          ) : <EmptyState title="公開中のDaily Topicはまだありません。">公開中のDaily Topicがない場合も、Timelineから最近の議論を確認できます。</EmptyState>}
        </div>

        <Card className="p-4 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">盛り上がっているTopic</p>
          <h2 className="mt-2 text-2xl font-black">活動量の高い議論</h2>
          <div className="mt-5 space-y-3">
            {trendingTopics.map((topic, index) => (
              <Link key={topic.id} href={`/topics/${topic.id}`} className="group block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-amber-300/35 hover:bg-white/[0.06]">
                <div className="flex items-start gap-3">
                  <span className="text-2xl font-black text-white/20">0{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold uppercase tracking-[0.2em] text-league-gold">{topic.category}</span>
                    <span className="mt-1 block font-black leading-snug group-hover:text-league-gold">{topic.title}</span>
                    <span className="mt-2 block text-xs text-league-muted">回答 {topic.answerCount} · コメント {topic.commentCount}</span>
                  </span>
                </div>
              </Link>
            ))}
            {trendingTopics.length === 0 ? <p className="text-sm leading-6 text-league-muted">新しいTopicが公開されると、ここに議論が表示されます。</p> : null}
          </div>
        </Card>
      </section>

      {activeWeeklyTopic ? (
        <section className="mt-5 lg:mt-8">
          <Card className="overflow-hidden border-amber-300/20 bg-[radial-gradient(circle_at_top_right,rgba(215,180,106,0.12),transparent_28%),linear-gradient(145deg,rgba(255,255,255,0.06),rgba(8,13,26,0.74))] p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">Weekly League</p>
                <h2 className="mt-2 text-xl font-black sm:text-3xl">{activeWeeklyTopic.title}</h2>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-league-silver sm:text-sm">
                  <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5">Phase: {getWeeklyStatusLabel(getWeeklyPhase(activeWeeklyTopic))}</span>
                  <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5">締切: {formatDateTime(activeWeeklyTopic.deadline_at)}</span>
                </div>
              </div>
              <ButtonLink href={`/weekly/${activeWeeklyTopic.id}`} className="px-4 py-2 text-xs sm:px-6 sm:py-3 sm:text-sm">Weekly Leagueに参加する</ButtonLink>
            </div>
          </Card>
        </section>
      ) : null}

      <section className="mt-6 lg:mt-10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">Recent active discussions</p>
            <h2 className="mt-1 text-2xl font-black sm:mt-2 sm:text-3xl">いま動いている議論</h2>
          </div>
          <ButtonLink href="/timeline" className="bg-none bg-white/10 text-white shadow-none ring-1 ring-white/15 hover:bg-white/15">Timelineを見る</ButtonLink>
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
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-league-gold">{topic?.category ?? "Topic"}</p>
                  <h3 className="mt-2 font-black leading-snug text-white">{topic?.title ?? "Daily Topic"}</h3>
                  <p className="mt-3 text-sm leading-7 text-league-silver">{createPreview(answer.content, 160)}</p>
                  <p className="mt-3 text-xs text-league-muted">{formatDateTime(answer.created_at)} · いいね {answer.likeCount} · コメント {answer.commentCount}</p>
                </Link>
              </article>
            );
          })}
        </div>
        {feedAnswers.length === 0 ? <EmptyState title="まだ投稿はありません。">最初の回答が投稿されると、ここにリーグの議論が流れます。</EmptyState> : null}
      </section>
    </main>
  );
}
