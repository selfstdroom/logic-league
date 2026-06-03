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
import type { TopicAnswer } from "@/types/database";
import type { Profile } from "@/types/logic-league";

type FeedAnswer = Pick<TopicAnswer, "id" | "topic_id" | "user_id" | "answer_type" | "content" | "created_at"> & {
  profile?: Pick<Profile, "display_name" | "username" | "rank">;
};

function displayName(profile?: Pick<Profile, "display_name" | "username">) {
  return profile?.display_name || profile?.username || "Logic Player";
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
      .limit(5),
    supabase
      .from("topics")
      .select("id, category, title, deadline_at, vote_deadline_at, publish_at")
      .eq("type", "weekly")
      .eq("status", "published")
      .order("publish_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("topic_answers")
      .select("id, topic_id, user_id, answer_type, content, created_at, topics!inner(type)")
      .eq("topics.type", "daily")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("topic_answers")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const answerRows = (latestAnswers ?? []) as FeedAnswer[];
  const userIds = Array.from(new Set(answerRows.map((answer) => answer.user_id)));
  const profileClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;
  const { data: answerProfiles } = userIds.length > 0
    ? await profileClient.from("profiles").select("id, display_name, username, rank").in("id", userIds)
    : { data: [] as Pick<Profile, "id" | "display_name" | "username" | "rank">[] };
  const profilesById = new Map((answerProfiles ?? []).map((answerProfile) => [answerProfile.id, answerProfile]));
  const feedAnswers: FeedAnswer[] = answerRows.map((answer) => ({ ...answer, profile: profilesById.get(answer.user_id) }));
  const topics = latestTopics ?? [];
  const featuredTopic = topics[0];
  const sideTopics = topics.slice(1, 5);
  const activeWeeklyTopic = (weeklyTopics ?? []).find((topic) => ["submission", "voting"].includes(getWeeklyPhase(topic))) ?? (weeklyTopics ?? [])[0];
  const seasonName = "Season 01 · Genesis Circuit";
  const quickActions = [
    { href: "/exam", label: "認定試験", accent: "Certification" },
    { href: "/topics", label: "Topics", accent: "Daily" },
    { href: `/profile/${profile.username}`, label: "プロフィール", accent: "Profile" },
    ...(activeWeeklyTopic ? [{ href: `/weekly/${activeWeeklyTopic.id}`, label: "Weekly League", accent: "Arena" }] : []),
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:py-12">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6">
        <Card className="p-0">
          <div className="relative overflow-hidden px-4 py-4 sm:p-8">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-300/10 blur-3xl" />
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/40 to-transparent" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.62rem] font-black uppercase tracking-[0.28em] text-league-gold sm:text-xs">Member Card</p>
                <h1 className="mt-2 truncate text-2xl font-black leading-tight sm:text-5xl">{profile.display_name ?? profile.username}</h1>
                <p className="mt-1 truncate text-sm text-league-muted">@{profile.username} · {seasonName}</p>
              </div>
              <RankBadge rank={profile.rank} size="sm" showLabel labelPlacement="bottom" className="shrink-0" />
            </div>

            <div className="relative mt-4 grid grid-cols-2 gap-2 sm:mt-8 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-amber-200/20 bg-amber-200/[0.06] p-3 sm:rounded-2xl sm:p-4">
                <span className="text-[0.62rem] uppercase tracking-[0.2em] text-league-muted">あなたのRank</span>
                <p className="mt-1 text-lg font-black text-league-gold sm:text-2xl">{profile.rank}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-3 sm:rounded-2xl sm:p-4">
                <span className="text-[0.62rem] uppercase tracking-[0.2em] text-league-muted">現在のRating</span>
                <p className="mt-1 text-lg font-black sm:text-2xl">{profile.rating}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-3 sm:rounded-2xl sm:p-4">
                <span className="text-[0.62rem] uppercase tracking-[0.2em] text-league-muted">推定思考偏差値</span>
                <p className="mt-1 text-lg font-black sm:text-2xl">{profile.predicted_deviation}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-3 sm:rounded-2xl sm:p-4">
                <span className="text-[0.62rem] uppercase tracking-[0.2em] text-league-muted">思考アーキタイプ</span>
                <p className="mt-1 truncate text-lg font-black sm:text-2xl">{profile.archetype ?? "未分類"}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="hidden flex-col justify-between lg:flex">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">現在のシーズン</p>
            <h2 className="mt-3 text-3xl font-black">Genesis Circuit</h2>
            <p className="mt-3 text-sm leading-6 text-league-silver">Daily Topicsで論点を磨き、CounterやSupportを重ねながらRatingを高めていきます。Hall of Fameに残る思考の記録を築きましょう。</p>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-2xl font-black">{answerCount ?? 0}</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-league-muted">Answer</p></div>
            <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-2xl font-black">0</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-league-muted">勝利</p></div>
            <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-2xl font-black">0</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-league-muted">Top 10</p></div>
          </div>
        </Card>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:mt-6">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href} className="group rounded-xl border border-white/10 bg-white/[0.045] px-3 py-3 transition hover:border-amber-300/35 hover:bg-white/[0.075] sm:rounded-2xl sm:px-4 sm:py-4">
            <span className="text-[0.58rem] font-black uppercase tracking-[0.2em] text-league-gold/80">{action.accent}</span>
            <span className="mt-1 block text-sm font-black text-white group-hover:text-league-gold sm:text-base">{action.label}</span>
          </Link>
        ))}
      </section>

      <section className="mt-4 lg:mt-10">
        <Card className="overflow-hidden border-amber-300/20 bg-[radial-gradient(circle_at_top_right,rgba(215,180,106,0.12),transparent_28%),linear-gradient(145deg,rgba(255,255,255,0.06),rgba(8,13,26,0.74))] p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[0.62rem] font-black uppercase tracking-[0.28em] text-league-gold sm:text-xs">Weekly League</p>
              <h2 className="mt-2 text-xl font-black sm:text-3xl">{activeWeeklyTopic ? activeWeeklyTopic.title : "No active weekly topic"}</h2>
              {activeWeeklyTopic ? (
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-league-silver sm:text-sm">
                  <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5">Phase: {getWeeklyStatusLabel(getWeeklyPhase(activeWeeklyTopic))}</span>
                  <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5">締切: {formatDateTime(activeWeeklyTopic.deadline_at)}</span>
                </div>
              ) : <p className="mt-2 text-sm text-league-silver">Weekly League fixtures will appear here when scheduled.</p>}
            </div>
            <ButtonLink href={activeWeeklyTopic ? `/weekly/${activeWeeklyTopic.id}` : "/weekly"} className="px-4 py-2 text-xs sm:px-6 sm:py-3 sm:text-sm">参加する</ButtonLink>
          </div>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 lg:mt-10 lg:grid-cols-[1fr_0.85fr_0.85fr] lg:gap-6">
        <div className="lg:col-span-1">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">盛り上がっているTopic</p>
              <h2 className="mt-1 text-xl font-black sm:mt-2 sm:text-2xl">最新のDaily Topics</h2>
            </div>
            <Link href="/topics" className="text-sm font-bold text-league-gold hover:text-white">すべて見る →</Link>
          </div>
          {featuredTopic ? <TopicCard topic={featuredTopic} featured /> : <EmptyState title="公開中のDaily Topicはまだありません。">公開中のDaily Topicはまだありません。</EmptyState>}
        </div>

        <Card className="p-4 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">注目の議論</p>
          <div className="mt-5 space-y-4">
            {sideTopics.slice(0, 3).map((topic, index) => (
              <Link key={topic.id} href={`/topics/${topic.id}`} className="group flex gap-3 rounded-xl border border-white/10 bg-black/20 p-3 transition hover:border-amber-300/35 hover:bg-white/[0.06] sm:gap-4 sm:rounded-2xl sm:p-4">
                <span className="text-2xl font-black text-white/20">0{index + 1}</span>
                <span>
                  <span className="block text-xs font-bold uppercase tracking-[0.2em] text-league-gold">{topic.category}</span>
                  <span className="mt-2 block font-bold leading-snug group-hover:text-league-gold">{topic.title}</span>
                </span>
              </Link>
            ))}
            {sideTopics.length === 0 ? <p className="text-sm leading-6 text-league-muted">新しいTopicが公開されると、ここに議論が表示されます。</p> : null}
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">最近の活動</p>
          <div className="mt-5 space-y-4">
            {feedAnswers.slice(0, 4).map((answer) => (
              <Link key={answer.id} href={`/topics/${answer.topic_id}`} className="block rounded-xl border border-white/10 bg-black/20 p-3 transition hover:border-white/25 hover:bg-white/[0.06] sm:rounded-2xl sm:p-4">
                <p className="text-sm font-bold text-white">{displayName(answer.profile)}</p>
                <p className="mt-1 text-xs text-league-muted">{answer.answer_type ?? "Answer"} · {formatDateTime(answer.created_at)}</p>
                <p className="mt-2 text-sm leading-6 text-league-silver">{createPreview(answer.content, 76)}</p>
              </Link>
            ))}
            {feedAnswers.length === 0 ? <p className="text-sm leading-6 text-league-muted">まだ投稿はありません。最初の回答を投稿して、議論を始めましょう。</p> : null}
          </div>
        </Card>
      </section>

      <section className="mt-6 lg:mt-10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">議論フィード</p>
            <h2 className="mt-1 text-2xl font-black sm:mt-2 sm:text-3xl">Logic Leagueの最新Answer</h2>
          </div>
          <ButtonLink href="/topics" className="bg-none bg-white/10 text-white shadow-none ring-1 ring-white/15 hover:bg-white/15">すべて見る</ButtonLink>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {feedAnswers.map((answer) => (
            <Link key={answer.id} href={`/topics/${answer.topic_id}`} className="group rounded-xl border border-white/10 bg-white/[0.04] p-4 transition duration-300 hover:-translate-y-1 hover:border-amber-300/35 hover:bg-white/[0.07] sm:rounded-[1.5rem] sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <RankBadge rank={answer.profile?.rank} size="sm" />
                  <div>
                    <p className="font-black">{displayName(answer.profile)}</p>
                    <p className="text-xs text-league-muted">{formatDateTime(answer.created_at)}</p>
                  </div>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-league-silver">{answer.answer_type ?? "Answer"}</span>
              </div>
              <p className="mt-4 text-sm leading-7 text-league-silver">{createPreview(answer.content, 180)}</p>
            </Link>
          ))}
        </div>
        {feedAnswers.length === 0 ? <EmptyState title="まだ投稿はありません。">最初の回答が投稿されると、ここにリーグの議論が流れます。</EmptyState> : null}
      </section>
    </main>
  );
}
