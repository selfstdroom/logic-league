import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { HeroPanel, PageShell, SectionHeader } from "@/components/ui/DesignSystem";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatTopicCategory } from "@/lib/topics/format";
import { getWeeklyPhase, getWeeklyStatusLabel, type WeeklyPhase } from "@/lib/weekly";
import type { Topic } from "@/types/database";

type TopicGroup = { title: string; description: string; phases: WeeklyPhase[] };

const groups: TopicGroup[] = [
  { title: "開催中のWeekly League", description: "投稿または投票を受付中の回です。", phases: ["submission", "voting"] },
  { title: "公開予定のWeekly League", description: "今後公開される予定の回です。", phases: ["upcoming"] },
  { title: "終了したWeekly League", description: "結果を確認できる過去の回です。", phases: ["completed"] },
];

function WeeklyTopicCard({ topic }: { topic: Topic }) {
  const phase = getWeeklyPhase(topic);
  return (
    <Link href={`/weekly/${topic.id}`} className="group block rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 transition duration-300 hover:-translate-y-1 hover:border-amber-300/40 hover:bg-white/[0.07]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-league-gold">{formatTopicCategory(topic.category)}</span>
        <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-bold text-league-silver">{getWeeklyStatusLabel(phase)}</span>
      </div>
      <h3 className="mt-4 text-2xl font-black leading-tight group-hover:text-league-gold">{topic.title}</h3>
      <div className="mt-5 grid gap-3 text-sm text-league-silver sm:grid-cols-2">
        <p><span className="block text-xs uppercase tracking-[0.18em] text-league-muted">投稿締切</span>{formatDateTime(topic.deadline_at)}</p>
        <p><span className="block text-xs uppercase tracking-[0.18em] text-league-muted">公開日時</span>{formatDateTime(topic.reveal_at)}</p>
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
    <PageShell className="max-w-7xl">
      <HeroPanel eyebrow="Weekly League" title="匿名で競い、公開Rankingで実力を示す。">
        締切までに投稿し、匿名公開後に最大3票を投じて、Weekly Leagueの順位を競います。
      </HeroPanel>

      {error ? <Card className="mt-8 text-red-300">Weekly LeagueのTopic取得に失敗しました: {error.message}</Card> : null}

      <div className="mt-10 space-y-10">
        {groups.map((group) => {
          const groupTopics = topicList.filter((topic) => group.phases.includes(getWeeklyPhase(topic)));
          return (
            <section key={group.title}>
              <SectionHeader eyebrow={group.title} title={group.description} action={<ButtonLink href="/home" className="bg-none bg-white/10 text-white shadow-none ring-1 ring-white/15">ホーム</ButtonLink>} />
              <div className="grid gap-5 lg:grid-cols-2">
                {groupTopics.map((topic) => <WeeklyTopicCard key={topic.id} topic={topic} />)}
              </div>
              {groupTopics.length === 0 ? <EmptyState title="この区分のTopicはまだありません。">Weekly LeagueのTopicが予定されると、ここに表示されます。</EmptyState> : null}
            </section>
          );
        })}
      </div>
    </PageShell>
  );
}
