import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/topics/format";
import { getWeeklyPhase, getWeeklyStatusLabel, type WeeklyPhase } from "@/lib/weekly";
import type { Topic } from "@/types/database";

type TopicGroup = { title: string; description: string; phases: WeeklyPhase[] };

const groups: TopicGroup[] = [
  { title: "Active Weekly League", description: "Submission and voting windows currently open.", phases: ["submission", "voting"] },
  { title: "Upcoming Weekly League", description: "Future fixtures on the league calendar.", phases: ["upcoming"] },
  { title: "Completed Weekly League", description: "Archived matches with results available.", phases: ["completed"] },
];

function WeeklyTopicCard({ topic }: { topic: Topic }) {
  const phase = getWeeklyPhase(topic);
  return (
    <Link href={`/weekly/${topic.id}`} className="group block rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 transition duration-300 hover:-translate-y-1 hover:border-amber-300/40 hover:bg-white/[0.07]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-league-gold">{topic.category}</span>
        <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-bold text-league-silver">{getWeeklyStatusLabel(phase)}</span>
      </div>
      <h3 className="mt-4 text-2xl font-black leading-tight group-hover:text-league-gold">{topic.title}</h3>
      <div className="mt-5 grid gap-3 text-sm text-league-silver sm:grid-cols-2">
        <p><span className="block text-xs uppercase tracking-[0.18em] text-league-muted">Submission deadline</span>{formatDateTime(topic.deadline_at)}</p>
        <p><span className="block text-xs uppercase tracking-[0.18em] text-league-muted">Reveal date</span>{formatDateTime(topic.reveal_at)}</p>
      </div>
    </Link>
  );
}

export default async function WeeklyPage() {
  const supabase = await createClient();
  const { data: topics, error } = await supabase
    .from("topics")
    .select("*")
    .eq("type", "weekly")
    .eq("status", "published")
    .order("publish_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const topicList = topics ?? [];

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:py-12">
      <div className="relative overflow-hidden rounded-[2rem] border border-amber-300/20 bg-[radial-gradient(circle_at_top_right,rgba(215,180,106,0.22),transparent_32%),linear-gradient(135deg,rgba(13,18,34,0.98),rgba(0,0,0,0.72))] p-6 shadow-2xl sm:p-10">
        <p className="text-xs font-black uppercase tracking-[0.34em] text-league-gold">Weekly League</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">Anonymous debate. Public ranking. Prestige on the line.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-league-silver">Submit before the deadline, enter an anonymous reveal, cast up to three votes, and climb the weekly leaderboard.</p>
      </div>

      {error ? <Card className="mt-8 text-red-300">Weekly topics could not be loaded: {error.message}</Card> : null}

      <div className="mt-10 space-y-10">
        {groups.map((group) => {
          const groupTopics = topicList.filter((topic) => group.phases.includes(getWeeklyPhase(topic)));
          return (
            <section key={group.title}>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">{group.title}</p>
                  <h2 className="mt-2 text-3xl font-black">{group.description}</h2>
                </div>
                <ButtonLink href="/home" className="bg-none bg-white/10 text-white shadow-none ring-1 ring-white/15">Dashboard</ButtonLink>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                {groupTopics.map((topic) => <WeeklyTopicCard key={topic.id} topic={topic} />)}
              </div>
              {groupTopics.length === 0 ? <EmptyState title="No fixtures in this section.">Weekly League topics will appear here when scheduled.</EmptyState> : null}
            </section>
          );
        })}
      </div>
    </main>
  );
}
