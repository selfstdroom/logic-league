import Link from "next/link";

export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { RankBadge } from "@/components/rank/RankBadge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/topics/format";
import { finalizeWeeklyLeague } from "@/lib/weekly";
import type { Profile } from "@/types/logic-league";

type ResultAnswer = {
  id: string;
  user_id: string;
  ai_total_score: number | null;
  vote_count: number;
  final_score: number | null;
  ranking_position: number | null;
};

function displayName(profile?: Pick<Profile, "display_name" | "username">) {
  return profile?.display_name || profile?.username || "Logic Player";
}

export default async function WeeklyResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: topic } = await admin.from("topics").select("*").eq("id", id).eq("type", "weekly").eq("status", "published").maybeSingle();
  if (!topic) notFound();

  if (!topic.vote_deadline_at || new Date(topic.vote_deadline_at).getTime() > Date.now()) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-6">
        <Card>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">Results locked</p>
          <h1 className="mt-3 text-4xl font-black">Results are available after voting closes.</h1>
          <p className="mt-4 text-league-silver">Vote deadline: {formatDateTime(topic.vote_deadline_at)}</p>
          <Link href={`/weekly/${topic.id}`} className="mt-6 inline-block text-sm font-bold text-league-gold hover:text-white">← Back to topic</Link>
        </Card>
      </main>
    );
  }

  await finalizeWeeklyLeague(topic.id);

  const { data: answers } = await admin
    .from("topic_answers")
    .select("id, user_id, ai_total_score, vote_count, final_score, ranking_position")
    .eq("topic_id", id)
    .order("ranking_position", { ascending: true, nullsFirst: false });

  const rows = (answers ?? []) as ResultAnswer[];
  const userIds = Array.from(new Set(rows.map((answer) => answer.user_id)));
  const { data: profiles } = userIds.length > 0
    ? await admin.from("profiles").select("id, display_name, username, rank").in("id", userIds)
    : { data: [] as Pick<Profile, "id" | "display_name" | "username" | "rank">[] };
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:py-12">
      <div className="relative overflow-hidden rounded-[2rem] border border-amber-300/20 bg-[radial-gradient(circle_at_top_right,rgba(215,180,106,0.2),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.07),rgba(8,13,26,0.78))] p-6 shadow-2xl sm:p-10">
        <p className="text-xs font-black uppercase tracking-[0.34em] text-league-gold">Weekly League Results</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">{topic.title}</h1>
        <p className="mt-5 text-league-silver">Final score = AI score × 70% + normalized vote score × 30%.</p>
      </div>

      <section className="mt-10 space-y-4">
        {rows.map((answer) => {
          const profile = profilesById.get(answer.user_id);
          return (
            <Card key={answer.id} className="hover:border-amber-300/35 hover:bg-white/[0.06]">
              <div className="grid gap-4 md:grid-cols-[0.4fr_1.2fr_0.8fr_0.8fr_0.8fr] md:items-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-league-muted">Rank</p>
                  <p className="mt-1 text-4xl font-black text-league-gold">#{answer.ranking_position ?? "-"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <RankBadge rank={profile?.rank} size="sm" />
                  <div>
                    <p className="text-lg font-black text-white">{displayName(profile)}</p>
                    <p className="text-sm text-league-muted">@{profile?.username ?? "unknown"}</p>
                  </div>
                </div>
                <div><p className="text-xs uppercase tracking-[0.18em] text-league-muted">Final score</p><p className="mt-1 text-2xl font-black">{answer.final_score ?? 0}</p></div>
                <div><p className="text-xs uppercase tracking-[0.18em] text-league-muted">AI score</p><p className="mt-1 text-2xl font-black">{answer.ai_total_score ?? 0}</p></div>
                <div><p className="text-xs uppercase tracking-[0.18em] text-league-muted">Vote count</p><p className="mt-1 text-2xl font-black">{answer.vote_count}</p></div>
              </div>
            </Card>
          );
        })}
      </section>
      {rows.length === 0 ? <EmptyState title="No results yet.">No submissions were finalized for this Weekly League topic.</EmptyState> : null}
      <Link href={`/weekly/${topic.id}`} className="mt-8 inline-block text-sm font-bold text-league-gold hover:text-white">← Back to topic</Link>
    </main>
  );
}
