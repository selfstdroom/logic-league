import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { HeroPanel, PageShell, PremiumBadge, SectionHeader, StatCard } from "@/components/ui/DesignSystem";
import { achievementDefinitions, ensureAchievementsSeeded } from "@/lib/achievements";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/topics/format";

export const dynamic = "force-dynamic";

type UserAchievementRow = { achievement_key: string | null; achievement_id: string | null; unlocked_at: string | null; created_at: string };

const categories = ["参加", "勝利", "活動", "Rank", "Hall of Fame"] as const;

export default async function AchievementsPage() {
  await ensureAchievementsSeeded();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();
  const { data: userAchievements } = user
    ? await admin.from("user_achievements").select("achievement_key, achievement_id, unlocked_at, created_at").eq("user_id", user.id)
    : { data: [] as UserAchievementRow[] };
  const earnedRows = (userAchievements ?? []) as UserAchievementRow[];
  const earnedByKey = new Map(earnedRows.map((row) => [row.achievement_key ?? row.achievement_id ?? "", row]));
  const earnedCount = achievementDefinitions.filter((achievement) => earnedByKey.has(achievement.key)).length;
  const completion = Math.round((earnedCount / achievementDefinitions.length) * 100);

  return (
    <PageShell>
      <HeroPanel eyebrow="実績" title="積み上げた思考の記録">
        回答、コメント、競技議論、Rank、Hall of Fameで達成した実績を確認できます。未獲得の実績も表示されるため、次の目標を選びやすくなります。
        <div className="mt-6 flex flex-wrap gap-3">
          <PremiumBadge tone="gold">獲得 {earnedCount}/{achievementDefinitions.length}</PremiumBadge>
          <PremiumBadge>達成率 {completion}%</PremiumBadge>
          {!user ? <Link href="/login" className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-black text-league-gold transition hover:bg-amber-300/20 hover:text-white">ログインする</Link> : null}
        </div>
      </HeroPanel>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="獲得済み" value={earnedCount} description="解除された実績" tone="gold" />
        <StatCard label="未獲得" value={achievementDefinitions.length - earnedCount} description="次に狙える目標" />
        <StatCard label="達成率" value={`${completion}%`} description="全実績に対する進捗" tone="emerald" />
      </section>

      <div className="mt-10 space-y-10">
        {categories.map((category) => {
          const achievements = achievementDefinitions.filter((achievement) => achievement.category === category);
          return (
            <section key={category}>
              <SectionHeader eyebrow={category} title={`${category}の実績`} />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {achievements.map((achievement) => {
                  const earned = earnedByKey.get(achievement.key);
                  const isEarned = Boolean(earned);
                  return (
                    <Card key={achievement.key} className={isEarned ? "border-amber-300/25" : "opacity-75 grayscale"}>
                      <div className="flex items-start gap-4">
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-lg font-black ${isEarned ? "border-amber-300/35 bg-amber-300/15 text-league-gold shadow-glow" : "border-white/10 bg-white/[0.04] text-league-muted"}`}>{isEarned ? achievement.badgeIcon : "🔒"}</div>
                        <div>
                          <p className="font-black text-white">{achievement.title}</p>
                          <p className="mt-2 text-sm leading-6 text-league-silver">{achievement.description}</p>
                          <p className="mt-3 text-xs text-league-muted">{isEarned ? `獲得日: ${formatDateTime(earned?.unlocked_at ?? earned?.created_at ?? null)}` : "未獲得"}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </PageShell>
  );
}
