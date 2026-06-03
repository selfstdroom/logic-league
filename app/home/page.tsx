import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { createPreview } from "@/lib/topics/format";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile?.predicted_deviation) redirect("/exam");

  const { data: latestTopics } = await supabase
    .from("topics")
    .select("id, category, title, content")
    .eq("type", "daily")
    .eq("status", "published")
    .order("publish_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-league-gold">League Dashboard</p>
          <h1 className="mt-3 text-4xl font-black">Home</h1>
        </div>
        <ButtonLink href={`/profile/${profile.username}`} className="bg-none bg-white/10 text-white shadow-none ring-1 ring-white/15">プロフィールを見る</ButtonLink>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Card><p className="text-league-muted">Rank</p><p className="mt-3 text-4xl font-black text-league-gold">{profile.rank}</p></Card>
        <Card><p className="text-league-muted">Rating</p><p className="mt-3 text-4xl font-black">{profile.rating}</p></Card>
        <Card><p className="text-league-muted">推定思考偏差値</p><p className="mt-3 text-4xl font-black">{profile.predicted_deviation}</p></Card>
      </div>
      <section className="mt-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-league-gold">Daily Topics</p>
            <h2 className="mt-2 text-2xl font-black">Latest Daily Topics</h2>
          </div>
          <ButtonLink href="/topics" className="bg-none bg-white/10 text-white shadow-none ring-1 ring-white/15">View All Topics</ButtonLink>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {(latestTopics ?? []).map((topic) => (
            <Card key={topic.id}>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-league-gold">{topic.category}</p>
              <h3 className="mt-3 text-xl font-black">{topic.title}</h3>
              <p className="mt-3 text-sm leading-6 text-league-silver">{createPreview(topic.content, 90)}</p>
              <ButtonLink href={`/topics/${topic.id}`} className="mt-5 bg-none bg-white/10 px-4 py-2 text-white shadow-none ring-1 ring-white/15">Read Topic</ButtonLink>
            </Card>
          ))}
          {(latestTopics ?? []).length === 0 ? <Card className="text-league-silver">公開中のDaily Topicはまだありません。</Card> : null}
        </div>
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card><h2 className="text-xl font-bold">Weekly League</h2><p className="mt-3 text-league-silver">Phase 3で実装予定。回答内容のみで競う本格リーグです。</p></Card>
        <Card><h2 className="text-xl font-bold">Hall of Fame</h2><p className="mt-3 text-league-silver">Phase 4で週次優勝回答を保存・表示します。</p></Card>
      </div>
    </main>
  );
}
