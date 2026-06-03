import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
  if (!profile) notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-league-gold to-white text-3xl font-black text-black">
            {profile.display_name?.[0] ?? profile.username[0]}
          </div>
          <div>
            <h1 className="text-4xl font-black">{profile.display_name ?? profile.username}</h1>
            <p className="mt-1 text-league-muted">@{profile.username}</p>
            <p className="mt-4 text-league-silver">{profile.bio ?? "まだbioはありません。"}</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <p className="rounded-2xl bg-white/[0.04] p-4"><span className="block text-sm text-league-muted">Rank</span><span className="text-xl font-bold text-league-gold">{profile.rank}</span></p>
          <p className="rounded-2xl bg-white/[0.04] p-4"><span className="block text-sm text-league-muted">Rating</span><span className="text-xl font-bold">{profile.rating}</span></p>
          <p className="rounded-2xl bg-white/[0.04] p-4"><span className="block text-sm text-league-muted">偏差値</span><span className="text-xl font-bold">{profile.predicted_deviation ?? "未受験"}</span></p>
          <p className="rounded-2xl bg-white/[0.04] p-4"><span className="block text-sm text-league-muted">Archetype</span><span className="text-xl font-bold">{profile.archetype ?? "-"}</span></p>
        </div>
      </Card>
    </main>
  );
}
