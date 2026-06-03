import { createAdminClient } from "@/lib/supabase/admin";
import type { Topic } from "@/types/database";

export type WeeklyPhase = "upcoming" | "submission" | "voting" | "completed";

export function getWeeklyPhase(topic: Pick<Topic, "publish_at" | "deadline_at" | "vote_deadline_at">, now = new Date()): WeeklyPhase {
  const nowMs = now.getTime();
  const publishMs = topic.publish_at ? new Date(topic.publish_at).getTime() : 0;
  const deadlineMs = topic.deadline_at ? new Date(topic.deadline_at).getTime() : Number.POSITIVE_INFINITY;
  const voteDeadlineMs = topic.vote_deadline_at ? new Date(topic.vote_deadline_at).getTime() : deadlineMs;

  if (publishMs > nowMs) return "upcoming";
  if (nowMs < deadlineMs) return "submission";
  if (nowMs < voteDeadlineMs) return "voting";
  return "completed";
}

export function getWeeklyStatusLabel(phase: WeeklyPhase) {
  if (phase === "submission") return "Submission Open";
  if (phase === "voting") return "Voting Open";
  if (phase === "completed") return "Completed";
  return "Upcoming";
}

export function calculateFinalScore(aiTotalScore: number | null, voteCount: number, maxVoteCount: number) {
  const aiScore = Math.max(0, Math.min(100, aiTotalScore ?? 0));
  const voteScoreNormalized = maxVoteCount > 0 ? (voteCount / maxVoteCount) * 100 : 0;
  return Number(((aiScore * 0.7) + (voteScoreNormalized * 0.3)).toFixed(2));
}

export function buildAiScoreSummary(answer: { ai_total_score: number | null; ai_structure_score: number | null; ai_logic_score: number | null; ai_originality_score: number | null; ai_feasibility_score: number | null; ai_risk_score: number | null }) {
  if (answer.ai_total_score == null) return "AI score pending";
  return `AI ${answer.ai_total_score}/100 · Structure ${answer.ai_structure_score ?? 0} · Logic ${answer.ai_logic_score ?? 0} · Originality ${answer.ai_originality_score ?? 0} · Feasibility ${answer.ai_feasibility_score ?? 0} · Risk ${answer.ai_risk_score ?? 0}`;
}

export async function finalizeWeeklyLeague(topicId: string) {
  const admin = createAdminClient();
  const { data: topic, error: topicError } = await admin
    .from("topics")
    .select("id, type, vote_deadline_at")
    .eq("id", topicId)
    .eq("type", "weekly")
    .maybeSingle();

  if (topicError) throw topicError;
  if (!topic) throw new Error("Weekly topic not found.");
  if (!topic.vote_deadline_at || new Date(topic.vote_deadline_at).getTime() > Date.now()) {
    throw new Error("Weekly results are not available yet.");
  }

  const { data: answers, error: answersError } = await admin
    .from("topic_answers")
    .select("id, ai_total_score, vote_count")
    .eq("topic_id", topicId);

  if (answersError) throw answersError;

  const rows = answers ?? [];
  const maxVoteCount = Math.max(0, ...rows.map((answer) => answer.vote_count ?? 0));
  const ranked = rows
    .map((answer) => ({
      id: answer.id,
      ai_total_score: answer.ai_total_score ?? 0,
      vote_count: answer.vote_count ?? 0,
      final_score: calculateFinalScore(answer.ai_total_score ?? 0, answer.vote_count ?? 0, maxVoteCount),
    }))
    .sort((a, b) => b.final_score - a.final_score || b.ai_total_score - a.ai_total_score || b.vote_count - a.vote_count);

  for (const [index, answer] of ranked.entries()) {
    const { error } = await admin
      .from("topic_answers")
      .update({ final_score: answer.final_score, ranking_position: index + 1 })
      .eq("id", answer.id);
    if (error) throw error;
  }

  return ranked;
}
