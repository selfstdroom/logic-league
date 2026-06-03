import { TopicCard } from "@/components/topics/TopicCard";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";

export default async function TopicsPage() {
  const supabase = await createClient();
  const { data: topics, error } = await supabase
    .from("topics")
    .select("id, category, title, content, publish_at")
    .eq("type", "daily")
    .eq("status", "published")
    .order("publish_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const topicList = topics ?? [];
  const featured = topicList[0];
  const rest = topicList.slice(1);

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:py-12">
      <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(215,180,106,0.13),rgba(8,13,26,0.78))] p-6 shadow-2xl sm:p-10">
        <p className="text-xs font-black uppercase tracking-[0.34em] text-league-gold">Daily Topics</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">今日の論点を選ぶ</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-league-silver">思考力を競うための毎日のお題です。閲覧は誰でも可能、認定ユーザーは回答できます。</p>
      </div>

      {error ? <Card className="mb-6 text-red-300">トピックの取得に失敗しました: {error.message}</Card> : null}

      {featured ? (
        <section className="mb-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <TopicCard topic={featured} featured />
          <Card>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">Guide</p>
            <h2 className="mt-3 text-3xl font-black">参加の流れ</h2>
            <div className="mt-6 space-y-4 text-sm leading-6 text-league-silver">
              <p className="rounded-2xl border border-white/10 bg-black/25 p-4">1. 前提を明確にし、立場を示す。</p>
              <p className="rounded-2xl border border-white/10 bg-black/25 p-4">2. 最も強い反論を想定し、論理で応答する。</p>
              <p className="rounded-2xl border border-white/10 bg-black/25 p-4">3. 精度の高い回答とコメントで評価を積み上げる。</p>
            </div>
          </Card>
        </section>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((topic) => <TopicCard key={topic.id} topic={topic} />)}
      </div>

      {!error && topicList.length === 0 ? <EmptyState title="公開中のDaily Topicはまだありません。">公開中のDaily Topicはまだありません。</EmptyState> : null}
    </main>
  );
}
