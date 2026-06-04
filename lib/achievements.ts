import { createAdminClient } from "@/lib/supabase/admin";

export type AchievementDefinition = {
  key: string;
  title: string;
  description: string;
  badgeIcon: string;
  category: "参加" | "勝利" | "活動" | "Rank" | "Hall of Fame";
};

export const achievementDefinitions: AchievementDefinition[] = [
  { key: "FIRST_ANSWER", title: "初参加", description: "初めて回答を投稿する", badgeIcon: "🏅", category: "参加" },
  { key: "FIRST_WEEKLY", title: "初Weekly参加", description: "初めてWeekly Leagueに参加する", badgeIcon: "◇", category: "参加" },
  { key: "FIRST_WIN", title: "初勝利", description: "Weekly Leagueで初めて1位を獲得する", badgeIcon: "🏆", category: "勝利" },
  { key: "TOP10", title: "初Top10", description: "Weekly Leagueで初めてTop10に入る", badgeIcon: "◆", category: "勝利" },
  { key: "TOP10_X5", title: "Top10 ×5", description: "Top10を5回達成する", badgeIcon: "◈", category: "勝利" },
  { key: "TOP10_X10", title: "Top10 ×10", description: "Top10を10回達成する", badgeIcon: "✦", category: "勝利" },
  { key: "ANSWER_10", title: "10回答達成", description: "回答を10件投稿する", badgeIcon: "10", category: "活動" },
  { key: "ANSWER_50", title: "50回答達成", description: "回答を50件投稿する", badgeIcon: "50", category: "活動" },
  { key: "ANSWER_100", title: "100回答達成", description: "回答を100件投稿する", badgeIcon: "100", category: "活動" },
  { key: "COMMENT_10", title: "10コメント達成", description: "コメントを10件投稿する", badgeIcon: "💬", category: "活動" },
  { key: "COMMENT_50", title: "50コメント達成", description: "コメントを50件投稿する", badgeIcon: "💭", category: "活動" },
  { key: "ANALYST_REACHED", title: "Analyst到達", description: "RankがAnalystに到達する", badgeIcon: "A", category: "Rank" },
  { key: "STRATEGIST_REACHED", title: "Strategist到達", description: "RankがStrategistに到達する", badgeIcon: "S", category: "Rank" },
  { key: "ARCHITECT_REACHED", title: "Architect到達", description: "RankがArchitectに到達する", badgeIcon: "⬡", category: "Rank" },
  { key: "MASTERMIND_REACHED", title: "Mastermind到達", description: "RankがMastermindに到達する", badgeIcon: "✦", category: "Rank" },
  { key: "ORACLE_REACHED", title: "Oracle到達", description: "RankがOracleに到達する", badgeIcon: "✺", category: "Rank" },
  { key: "HOF_FIRST", title: "Hall of Fame初掲載", description: "Hall of Fameに初めて掲載される", badgeIcon: "★", category: "Hall of Fame" },
  { key: "HOF_X3", title: "Hall of Fame ×3", description: "Hall of Fameに3回掲載される", badgeIcon: "★★★", category: "Hall of Fame" },
  { key: "HOF_X10", title: "Hall of Fame ×10", description: "Hall of Fameに10回掲載される", badgeIcon: "★10", category: "Hall of Fame" },
];

export type UnlockedAchievement = Pick<AchievementDefinition, "key" | "title" | "badgeIcon">;

const rankOrder = ["Visitor", "Challenger", "Analyst", "Strategist", "Architect", "Mastermind", "Oracle"];

function hasReached(rank: string | null | undefined, target: string) {
  return rankOrder.indexOf(rank ?? "Visitor") >= rankOrder.indexOf(target);
}

function definitionByKey(key: string) {
  return achievementDefinitions.find((achievement) => achievement.key === key);
}

export async function ensureAchievementsSeeded() {
  const admin = createAdminClient();
  const rows = achievementDefinitions.map((achievement) => ({
    id: achievement.key,
    key: achievement.key,
    title: achievement.title,
    description: achievement.description,
    icon: achievement.badgeIcon,
    badge_icon: achievement.badgeIcon,
  }));
  const { error } = await admin.from("achievements").upsert(rows, { onConflict: "key" });
  if (error) throw error;
}

export async function grantAchievement(userId: string, achievementKey: string): Promise<UnlockedAchievement[]> {
  await ensureAchievementsSeeded();
  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin
    .from("user_achievements")
    .select("achievement_key, achievement_id")
    .eq("user_id", userId)
    .or(`achievement_key.eq.${achievementKey},achievement_id.eq.${achievementKey}`)
    .limit(1);
  if (existingError) throw existingError;
  if ((existing ?? []).length > 0) return [];

  const { error } = await admin.from("user_achievements").upsert({
    user_id: userId,
    achievement_id: achievementKey,
    achievement_key: achievementKey,
  }, { onConflict: "user_id,achievement_key", ignoreDuplicates: true });
  if (error) throw error;

  const definition = definitionByKey(achievementKey);
  return definition ? [{ key: definition.key, title: definition.title, badgeIcon: definition.badgeIcon }] : [];
}

export async function evaluateAchievements(userId: string): Promise<UnlockedAchievement[]> {
  await ensureAchievementsSeeded();
  const admin = createAdminClient();
  const [
    { count: totalAnswers },
    { count: weeklySubmissions },
    { count: weeklyWins },
    { count: top10Count },
    { count: commentCount },
    { data: profile },
    { data: existingRows },
  ] = await Promise.all([
    admin.from("topic_answers").select("id", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("topic_answers").select("id, topics!inner(type)", { count: "exact", head: true }).eq("user_id", userId).eq("topics.type", "weekly"),
    admin.from("hall_of_fame").select("id", { count: "exact", head: true }).eq("winner_user_id", userId),
    admin.from("topic_answers").select("id, topics!inner(type)", { count: "exact", head: true }).eq("user_id", userId).eq("topics.type", "weekly").lte("ranking_position", 10),
    admin.from("comments").select("id", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("profiles").select("rank").eq("id", userId).maybeSingle(),
    admin.from("user_achievements").select("achievement_key, achievement_id").eq("user_id", userId),
  ]);

  const grants: string[] = [];
  if ((totalAnswers ?? 0) >= 1) grants.push("FIRST_ANSWER");
  if ((weeklySubmissions ?? 0) >= 1) grants.push("FIRST_WEEKLY");
  if ((weeklyWins ?? 0) >= 1) grants.push("FIRST_WIN", "HOF_FIRST");
  if ((weeklyWins ?? 0) >= 3) grants.push("HOF_X3");
  if ((weeklyWins ?? 0) >= 10) grants.push("HOF_X10");
  if ((top10Count ?? 0) >= 1) grants.push("TOP10");
  if ((top10Count ?? 0) >= 5) grants.push("TOP10_X5");
  if ((top10Count ?? 0) >= 10) grants.push("TOP10_X10");
  if ((totalAnswers ?? 0) >= 10) grants.push("ANSWER_10");
  if ((totalAnswers ?? 0) >= 50) grants.push("ANSWER_50");
  if ((totalAnswers ?? 0) >= 100) grants.push("ANSWER_100");
  if ((commentCount ?? 0) >= 10) grants.push("COMMENT_10");
  if ((commentCount ?? 0) >= 50) grants.push("COMMENT_50");

  const rank = profile?.rank;
  if (hasReached(rank, "Analyst")) grants.push("ANALYST_REACHED");
  if (hasReached(rank, "Strategist")) grants.push("STRATEGIST_REACHED");
  if (hasReached(rank, "Architect")) grants.push("ARCHITECT_REACHED");
  if (hasReached(rank, "Mastermind")) grants.push("MASTERMIND_REACHED");
  if (hasReached(rank, "Oracle")) grants.push("ORACLE_REACHED");

  const existing = new Set((existingRows ?? []).flatMap((row) => [row.achievement_key, row.achievement_id].filter(Boolean) as string[]));
  const newKeys = Array.from(new Set(grants)).filter((key) => !existing.has(key));
  if (newKeys.length === 0) return [];

  const rows = newKeys.map((key) => ({ user_id: userId, achievement_id: key, achievement_key: key }));
  const { error } = await admin.from("user_achievements").upsert(rows, { onConflict: "user_id,achievement_key", ignoreDuplicates: true });
  if (error) throw error;

  return newKeys.flatMap((key) => {
    const definition = definitionByKey(key);
    return definition ? [{ key: definition.key, title: definition.title, badgeIcon: definition.badgeIcon }] : [];
  });
}
