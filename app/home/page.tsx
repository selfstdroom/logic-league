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

  const [{ data: latestTopics }, { data: latestAnswers }, { count: answerCount }] = await Promise.all([
    supabase
      .from("topics")
      .select("id, category, title, content, publish_at")
      .eq("type", "daily")
      .eq("status", "published")
      .order("publish_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("topic_answers")
      .select("id, topic_id, user_id, answer_type, content, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("topic_answers")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const answerRows = latestAnswers ?? [];
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
  const seasonName = "Season 01 · Genesis Circuit";

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:py-12">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-0">
          <div className="relative overflow-hidden p-6 sm:p-8">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-amber-300/10 blur-3xl" />
            <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <RankBadge rank={profile.rank} size="lg" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">League Profile</p>
                  <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">{profile.display_name ?? profile.username}</h1>
                  <p className="mt-2 text-league-muted">@{profile.username} · {seasonName}</p>
                </div>
              </div>
              <ButtonLink href={`/profile/${profile.username}`} className="bg-none bg-white/10 text-white shadow-none ring-1 ring-white/15 hover:bg-white/15">View Profile</ButtonLink>
            </div>

            <div className="relative mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4">
                <span className="text-xs uppercase tracking-[0.22em] text-league-muted">Rank</span>
                <p className="mt-2 text-2xl font-black text-league-gold">{profile.rank}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <span className="text-xs uppercase tracking-[0.22em] text-league-muted">Rating</span>
                <p className="mt-2 text-2xl font-black">{profile.rating}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <span className="text-xs uppercase tracking-[0.22em] text-league-muted">Predicted Deviation</span>
                <p className="mt-2 text-2xl font-black">{profile.predicted_deviation}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <span className="text-xs uppercase tracking-[0.22em] text-league-muted">Archetype</span>
                <p className="mt-2 text-2xl font-black">{profile.archetype ?? "Unclassified"}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">Current Season</p>
            <h2 className="mt-3 text-3xl font-black">Genesis Circuit</h2>
            <p className="mt-3 text-sm leading-6 text-league-silver">Daily arguments, public counters, and rising rating pressure. Build a record worthy of the Hall.</p>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-2xl font-black">{answerCount ?? 0}</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-league-muted">Answers</p></div>
            <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-2xl font-black">0</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-league-muted">Wins</p></div>
            <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-2xl font-black">0</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-league-muted">Top 10</p></div>
          </div>
        </Card>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.85fr_0.85fr]">
        <div className="lg:col-span-1">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">Trending Topics</p>
              <h2 className="mt-2 text-2xl font-black">Arena Briefs</h2>
            </div>
            <Link href="/topics" className="text-sm font-bold text-league-gold hover:text-white">All →</Link>
          </div>
          {featuredTopic ? <TopicCard topic={featuredTopic} featured /> : <EmptyState title="No briefs published">公開中のDaily Topicはまだありません。</EmptyState>}
        </div>

        <Card>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">Popular Discussions</p>
          <div className="mt-5 space-y-4">
            {sideTopics.slice(0, 3).map((topic, index) => (
              <Link key={topic.id} href={`/topics/${topic.id}`} className="group flex gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-amber-300/35 hover:bg-white/[0.06]">
                <span className="text-2xl font-black text-white/20">0{index + 1}</span>
                <span>
                  <span className="block text-xs font-bold uppercase tracking-[0.2em] text-league-gold">{topic.category}</span>
                  <span className="mt-2 block font-bold leading-snug group-hover:text-league-gold">{topic.title}</span>
                </span>
              </Link>
            ))}
            {sideTopics.length === 0 ? <p className="text-sm leading-6 text-league-muted">More discussions will appear as new briefs enter the arena.</p> : null}
          </div>
        </Card>

        <Card>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">Recent Activity</p>
          <div className="mt-5 space-y-4">
            {feedAnswers.slice(0, 4).map((answer) => (
              <Link key={answer.id} href={`/topics/${answer.topic_id}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/25 hover:bg-white/[0.06]">
                <p className="text-sm font-bold text-white">{displayName(answer.profile)}</p>
                <p className="mt-1 text-xs text-league-muted">{answer.answer_type ?? "Answer"} · {formatDateTime(answer.created_at)}</p>
                <p className="mt-2 text-sm leading-6 text-league-silver">{createPreview(answer.content, 76)}</p>
              </Link>
            ))}
            {feedAnswers.length === 0 ? <p className="text-sm leading-6 text-league-muted">No public answers yet. Be the first to shape the debate.</p> : null}
          </div>
        </Card>
      </section>

      <section className="mt-10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">Discussion Feed</p>
            <h2 className="mt-2 text-3xl font-black">Latest Answers from the League</h2>
          </div>
          <ButtonLink href="/topics" className="bg-none bg-white/10 text-white shadow-none ring-1 ring-white/15 hover:bg-white/15">Enter the Arena</ButtonLink>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {feedAnswers.map((answer) => (
            <Link key={answer.id} href={`/topics/${answer.topic_id}`} className="group rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 transition duration-300 hover:-translate-y-1 hover:border-amber-300/35 hover:bg-white/[0.07]">
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
        {feedAnswers.length === 0 ? <EmptyState title="The feed is quiet">最初の回答が投稿されると、ここにリーグの議論が流れます。</EmptyState> : null}
      </section>
    </main>
  );
}
