import { evaluateAchievements, grantAchievement } from "@/lib/achievements";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRankByRating } from "@/lib/rank";
import type { Profile } from "@/types/logic-league";

export function getRatingDelta(position: number) {
  if (position === 1) return 50;
  if (position === 2) return 40;
  if (position === 3) return 30;
  if (position >= 4 && position <= 10) return 10;
  return 2;
}

export function getSeasonInfo(date = new Date()) {
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();
  const seasonIndex = Math.floor(month / 3);
  const names = ["Spring", "Summer", "Autumn", "Winter"] as const;
  return {
    key: `${year}-${names[seasonIndex].toLowerCase()}`,
    name: names[seasonIndex],
    label: `${year} ${names[seasonIndex]}`,
  };
}

export { evaluateAchievements, grantAchievement };

export async function snapshotCurrentSeason() {
  const admin = createAdminClient();
  const season = getSeasonInfo();
  const [{ data: profiles }, { data: wins }] = await Promise.all([
    admin.from("profiles").select("id, rating, rank").order("rating", { ascending: false }).limit(100),
    admin.from("hall_of_fame").select("winner_user_id"),
  ]);
  const winCounts = new Map<string, number>();
  for (const win of wins ?? []) {
    if (win.winner_user_id) winCounts.set(win.winner_user_id, (winCounts.get(win.winner_user_id) ?? 0) + 1);
  }
  const rows = ((profiles ?? []) as Pick<Profile, "id" | "rating" | "rank">[]).map((profile, index) => ({
    season_key: season.key,
    season_name: season.name,
    user_id: profile.id,
    rating: profile.rating,
    rank: profile.rank,
    position: index + 1,
    weekly_wins: winCounts.get(profile.id) ?? 0,
  }));
  if (rows.length === 0) return;
  const { error } = await admin.from("season_snapshots").upsert(rows, { onConflict: "season_key,user_id" });
  if (error) throw error;
}

export async function applyRatingChange(userId: string, topicId: string, delta: number) {
  const admin = createAdminClient();
  const { data: existing } = await admin.from("rating_histories").select("id").eq("user_id", userId).eq("topic_id", topicId).eq("reason", "weekly_result").maybeSingle();
  if (existing) return;

  const { data: profile, error } = await admin.from("profiles").select("rating, qualified").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (!profile) return;

  const oldRating = profile.rating ?? 0;
  const newRating = oldRating + delta;
  const newRank = getRankByRating(newRating, profile.qualified ?? true);

  const { error: updateError } = await admin.from("profiles").update({ rating: newRating, rank: newRank }).eq("id", userId);
  if (updateError) throw updateError;

  const { error: historyError } = await admin.from("rating_histories").insert({
    user_id: userId,
    topic_id: topicId,
    old_rating: oldRating,
    new_rating: newRating,
    delta,
    reason: "weekly_result",
  });
  if (historyError) throw historyError;
}
