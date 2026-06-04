import Link from "next/link";
import { RankBadge } from "@/components/rank/RankBadge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { HeroPanel, PageShell, SectionHeader } from "@/components/ui/DesignSystem";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/logic-league";

export const dynamic = "force-dynamic";

type OracleProfile = Pick<Profile, "id" | "username" | "display_name" | "rank" | "rating" | "archetype">;

export default async function OraclePage() {
  const admin = createAdminClient();
  const [{ data: profiles }, { data: wins }] = await Promise.all([
    admin.from("profiles").select("id, username, display_name, rank, rating, archetype").eq("rank", "Oracle").order("rating", { ascending: false }),
    admin.from("hall_of_fame").select("winner_user_id"),
  ]);
  const winCounts = new Map<string, number>();
  for (const win of wins ?? []) if (win.winner_user_id) winCounts.set(win.winner_user_id, (winCounts.get(win.winner_user_id) ?? 0) + 1);

  return (
    <PageShell>
      <HeroPanel eyebrow="Oracle" title="最上位層の思考家">
        OracleはRating 2500以上に到達した知的競技者です。Weekly Leagueで継続的に結果を出した、Logic League最高峰の公開ポートフォリオです。
      </HeroPanel>
      <section className="mt-10">
        <SectionHeader eyebrow="Oracle Users" title="Oracle一覧" />
        <div className="grid gap-5 md:grid-cols-2">
          {((profiles ?? []) as OracleProfile[]).map((profile) => (
            <Card key={profile.id} className="border-amber-300/25 bg-[radial-gradient(circle_at_top_right,rgba(215,180,106,0.18),transparent_30%),rgba(255,255,255,0.045)]">
              <div className="flex items-center gap-4">
                <RankBadge rank="Oracle" size="md" />
                <div className="min-w-0">
                  <Link href={`/profile/${profile.username}`} className="truncate text-2xl font-black text-white hover:text-league-gold">{profile.display_name ?? profile.username}</Link>
                  <p className="mt-1 truncate text-sm text-league-muted">@{profile.username}</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-black/25 p-3"><p className="text-2xl font-black">{profile.rating}</p><p className="text-xs text-league-muted">Rating</p></div>
                <div className="rounded-2xl bg-black/25 p-3"><p className="truncate text-lg font-black">{profile.archetype ?? "未分類"}</p><p className="text-xs text-league-muted">archetype</p></div>
                <div className="rounded-2xl bg-black/25 p-3"><p className="text-2xl font-black">{winCounts.get(profile.id) ?? 0}</p><p className="text-xs text-league-muted">weekly wins</p></div>
              </div>
            </Card>
          ))}
        </div>
        {(profiles ?? []).length === 0 ? <EmptyState title="Oracleはまだいません。">最初のOracle到達者は、ここに特別な存在として表示されます。</EmptyState> : null}
      </section>
    </PageShell>
  );
}
