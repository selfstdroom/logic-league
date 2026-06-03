import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { createPreview, formatDateTime } from "@/lib/topics/format";
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

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-league-gold">Daily Topics</p>
        <h1 className="mt-3 text-4xl font-black">Topics</h1>
        <p className="mt-4 max-w-2xl text-league-silver">思考力を競うための毎日のお題です。閲覧は誰でも可能、認定ユーザーは回答できます。</p>
      </div>

      {error ? <Card className="text-red-300">トピックの取得に失敗しました: {error.message}</Card> : null}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(topics ?? []).map((topic) => (
          <Link key={topic.id} href={`/topics/${topic.id}`} className="group block">
            <Card className="h-full transition group-hover:-translate-y-1 group-hover:border-amber-300/40">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-league-gold">{topic.category}</span>
                <time className="text-xs text-league-muted">{formatDateTime(topic.publish_at)}</time>
              </div>
              <h2 className="mt-5 text-2xl font-black leading-tight group-hover:text-league-gold">{topic.title}</h2>
              <p className="mt-4 text-sm leading-6 text-league-silver">{createPreview(topic.content)}</p>
            </Card>
          </Link>
        ))}
      </div>

      {!error && (topics ?? []).length === 0 ? <Card className="text-league-silver">公開中のDaily Topicはまだありません。</Card> : null}
    </main>
  );
}
