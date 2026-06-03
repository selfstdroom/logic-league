import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RankBadge } from "@/components/rank/RankBadge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { createPreview, formatDateTime } from "@/lib/topics/format";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
  if (!profile) notFound();

  const [{ count: dailyAnswerCount }, { data: recentAnswers }] = await Promise.all([
    supabase
      .from("topic_answers")
      .select("id, topics!inner(type)", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("topics.type", "daily"),
    supabase
      .from("topic_answers")
      .select("id, topic_id, answer_type, content, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:py-12">
      <Card className="p-0">
        <div className="relative overflow-hidden p-6 sm:p-10">
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-[2rem] border border-amber-300/35 bg-gradient-to-br from-league-gold via-white to-slate-500 text-4xl font-black text-black shadow-[0_0_60px_rgba(215,180,106,0.2)]">
                {profile.display_name?.[0] ?? profile.username[0]}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">Competitor Dossier</p>
                <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">{profile.display_name ?? profile.username}</h1>
                <p className="mt-2 text-league-muted">@{profile.username}</p>
                <p className="mt-4 max-w-2xl text-league-silver">{profile.bio ?? "まだbioはありません。"}</p>
              </div>
            </div>
            <RankBadge rank={profile.rank} size="lg" showLabel />
          </div>

          <div className="relative mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4"><span className="block text-xs uppercase tracking-[0.22em] text-league-muted">Rating</span><span className="mt-2 block text-3xl font-black text-white">{profile.rating}</span></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><span className="block text-xs uppercase tracking-[0.22em] text-league-muted">Deviation</span><span className="mt-2 block text-3xl font-black">{profile.predicted_deviation ?? "未受験"}</span></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><span className="block text-xs uppercase tracking-[0.22em] text-league-muted">Daily Answers</span><span className="mt-2 block text-3xl font-black">{dailyAnswerCount ?? 0}</span></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><span className="block text-xs uppercase tracking-[0.22em] text-league-muted">Qualified</span><span className="mt-2 block text-3xl font-black">{profile.qualified ? "Yes" : "No"}</span></div>
          </div>
        </div>
      </Card>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">Archetype</p>
          <h2 className="mt-3 text-3xl font-black">{profile.archetype ?? "Unclassified"}</h2>
          <p className="mt-4 text-sm leading-6 text-league-silver">This card summarizes the competitor&apos;s strategic identity from the qualification exam. It frames how they tend to structure arguments, risks, and counter-moves.</p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-2xl font-black">0</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-league-muted">Wins</p></div>
            <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-2xl font-black">0</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-league-muted">Top 10</p></div>
            <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-2xl font-black">0</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-league-muted">Hall</p></div>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">Activity</p>
          <h2 className="mt-3 text-3xl font-black">Recent Arena Moves</h2>
          <div className="mt-6 space-y-4">
            {(recentAnswers ?? []).map((answer) => (
              <Link key={answer.id} href={`/topics/${answer.topic_id}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-amber-300/35 hover:bg-white/[0.06]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-league-silver">{answer.answer_type ?? "Answer"}</span>
                  <time className="text-xs text-league-muted">{formatDateTime(answer.created_at)}</time>
                </div>
                <p className="mt-3 text-sm leading-6 text-league-silver">{createPreview(answer.content, 150)}</p>
              </Link>
            ))}
          </div>
          {(recentAnswers ?? []).length === 0 ? <EmptyState title="No activity yet">回答が投稿されると、ここにアクティビティが表示されます。</EmptyState> : null}
        </Card>
      </section>
    </main>
  );
}
