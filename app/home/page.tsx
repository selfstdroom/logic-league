import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile?.predicted_deviation) redirect("/exam");

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
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card><h2 className="text-xl font-bold">Daily Topics</h2><p className="mt-3 text-league-silver">Phase 2で実装予定。Visitorは閲覧のみ、合格者は回答可能になります。</p></Card>
        <Card><h2 className="text-xl font-bold">Weekly League</h2><p className="mt-3 text-league-silver">Phase 3で実装予定。回答内容のみで競う本格リーグです。</p></Card>
        <Card><h2 className="text-xl font-bold">Hall of Fame</h2><p className="mt-3 text-league-silver">Phase 4で週次優勝回答を保存・表示します。</p></Card>
      </div>
    </main>
  );
}
