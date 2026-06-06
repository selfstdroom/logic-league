import { getSeasonInfo } from "@/lib/competitive";
import { createAdminClient } from "@/lib/supabase/admin";

export type DeviationSourceType = "certification" | "weekly" | "season";
export type DisplayDeviationType = "certification" | "latest_weekly" | "highest_weekly" | "season_average";

export const deviationDisplayOptions: { value: DisplayDeviationType; label: string }[] = [
  { value: "certification", label: "認定偏差値" },
  { value: "latest_weekly", label: "最新Weekly偏差値" },
  { value: "highest_weekly", label: "最高Weekly偏差値" },
  { value: "season_average", label: "Season平均偏差値" },
];

export const validDisplayDeviationTypes = new Set<DisplayDeviationType>(deviationDisplayOptions.map((option) => option.value));

export type ThinkingDeviationHistory = {
  id: string;
  user_id: string;
  source_type: DeviationSourceType;
  topic_id: string | null;
  exam_answer_id: string | null;
  topic_answer_id?: string | null;
  deviation: number;
  score: number | null;
  label: string | null;
  created_at: string;
};

export function calculateWeeklyDeviation(finalScore: number | null | undefined) {
  const score = Number(finalScore ?? 0);
  const deviation = 50 + ((score - 60) * 0.6);
  return Number(Math.max(35, Math.min(80, deviation)).toFixed(1));
}

export function formatDeviation(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(1) : "—";
}

export function deviationTypeLabel(type: DisplayDeviationType) {
  return deviationDisplayOptions.find((option) => option.value === type)?.label ?? "認定偏差値";
}

export function resolveDisplayDeviationType(value: string | null | undefined): DisplayDeviationType {
  return value && validDisplayDeviationTypes.has(value as DisplayDeviationType) ? (value as DisplayDeviationType) : "certification";
}

export function currentSeasonStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), Math.floor(date.getUTCMonth() / 3) * 3, 1)).toISOString();
}

export async function recordCertificationDeviation(params: { userId: string; examAnswerId: string; deviation: number; score: number | null }) {
  const admin = createAdminClient();
  const payload = {
    user_id: params.userId,
    source_type: "certification" as const,
    exam_answer_id: params.examAnswerId,
    topic_id: null,
    topic_answer_id: null,
    deviation: params.deviation,
    score: params.score,
    label: "認定偏差値",
  };
  const { data: existing, error: selectError } = await admin
    .from("thinking_deviation_histories")
    .select("id")
    .eq("source_type", "certification")
    .eq("exam_answer_id", params.examAnswerId)
    .maybeSingle();
  if (selectError) throw selectError;
  const { error } = existing
    ? await admin.from("thinking_deviation_histories").update(payload).eq("id", existing.id)
    : await admin.from("thinking_deviation_histories").insert(payload);
  if (error) throw error;
}

export async function recordWeeklyDeviation(params: { userId: string; topicId: string; topicAnswerId: string; finalScore: number }) {
  const admin = createAdminClient();
  const deviation = calculateWeeklyDeviation(params.finalScore);
  const payload = {
    user_id: params.userId,
    source_type: "weekly" as const,
    topic_id: params.topicId,
    exam_answer_id: null,
    topic_answer_id: params.topicAnswerId,
    deviation,
    score: params.finalScore,
    label: "AI推定思考偏差値",
  };
  const { data: existing, error: selectError } = await admin
    .from("thinking_deviation_histories")
    .select("id")
    .eq("source_type", "weekly")
    .eq("topic_answer_id", params.topicAnswerId)
    .maybeSingle();
  if (selectError) throw selectError;
  const { error } = existing
    ? await admin.from("thinking_deviation_histories").update(payload).eq("id", existing.id)
    : await admin.from("thinking_deviation_histories").insert(payload);
  if (error) throw error;
  return deviation;
}

export async function recordSeasonDeviation(userId: string, topicId: string) {
  const admin = createAdminClient();
  const season = getSeasonInfo();
  const seasonStart = currentSeasonStart();
  const { data, error } = await admin
    .from("thinking_deviation_histories")
    .select("deviation")
    .eq("user_id", userId)
    .eq("source_type", "weekly")
    .gte("created_at", seasonStart)
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) throw error;

  const deviations = (data ?? []).map((row) => Number(row.deviation)).filter(Number.isFinite);
  if (deviations.length === 0) return null;

  const average = Number((deviations.reduce((sum, value) => sum + value, 0) / deviations.length).toFixed(1));
  const payload = {
    user_id: userId,
    source_type: "season" as const,
    topic_id: topicId,
    exam_answer_id: null,
    topic_answer_id: null,
    deviation: average,
    score: average,
    label: `${season.label} Season平均偏差値`,
  };
  const { data: existing, error: selectError } = await admin
    .from("thinking_deviation_histories")
    .select("id")
    .eq("user_id", userId)
    .eq("source_type", "season")
    .eq("topic_id", topicId)
    .maybeSingle();
  if (selectError) throw selectError;
  const { error: insertError } = existing
    ? await admin.from("thinking_deviation_histories").update(payload).eq("id", existing.id)
    : await admin.from("thinking_deviation_histories").insert(payload);
  if (insertError) throw insertError;
  return average;
}

export function getDeviationGoalText(latestWeekly: number | null, highestWeekly: number | null, seasonAverage: number | null) {
  if (latestWeekly != null && highestWeekly != null && latestWeekly < highestWeekly) {
    return `最高偏差値まであと${(highestWeekly - latestWeekly).toFixed(1)}`;
  }
  if (seasonAverage != null && seasonAverage < 60) {
    return `Season平均 60突破まであと${(60 - seasonAverage).toFixed(1)}`;
  }
  if (seasonAverage != null && seasonAverage < 65) {
    return `Season平均 65突破まであと${(65 - seasonAverage).toFixed(1)}`;
  }
  return "次のWeeklyで最高記録更新を狙いましょう";
}
