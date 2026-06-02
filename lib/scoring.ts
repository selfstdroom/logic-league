import { ARCHETYPE_NAMES, type ArchetypeName, type ExamEvaluation, type ExamResult } from "@/types/logic-league";

export const MIN_EXAM_ANSWER_LENGTH = 500;

export function calculatePredictedDeviation(totalScore: number) {
  return Math.round(50 + (totalScore - 50) * 0.6);
}

export function getUpperPercentile(deviation: number) {
  if (deviation >= 75) return "約1%";
  if (deviation >= 70) return "約2%";
  if (deviation >= 65) return "約7%";
  if (deviation >= 60) return "約16%";
  if (deviation >= 55) return "約31%";
  if (deviation >= 50) return "約50%";
  return "参加準備層";
}

function asScore(value: unknown) {
  const score = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(20, Math.round(score)));
}

function asText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function asArchetype(value: unknown): ArchetypeName {
  return ARCHETYPE_NAMES.includes(value as ArchetypeName) ? (value as ArchetypeName) : "Analyst";
}

export function normalizeExamEvaluation(raw: unknown): ExamEvaluation {
  if (!raw || typeof raw !== "object") throw new Error("AI採点結果がJSONオブジェクトではありません。");
  const obj = raw as Record<string, unknown>;
  const scores = {
    structure_score: asScore(obj.structure_score),
    hypothesis_score: asScore(obj.hypothesis_score),
    originality_score: asScore(obj.originality_score),
    feasibility_score: asScore(obj.feasibility_score),
    risk_score: asScore(obj.risk_score),
  };
  const total = scores.structure_score + scores.hypothesis_score + scores.originality_score + scores.feasibility_score + scores.risk_score;
  return {
    ...scores,
    total_score: total,
    archetype: asArchetype(obj.archetype),
    headline: asText(obj.headline, "あなたの思考には、次のリーグへ進むための輪郭があります。"),
    summary: asText(obj.summary, "回答の構造、仮説、実行可能性を総合的に評価しました。"),
    strength: asText(obj.strength, "課題を分解しようとする姿勢。"),
    weakness: asText(obj.weakness, "検証設計とリスク対策の具体化。"),
    upper_gap: asText(obj.upper_gap, "上位層との差は、因果の検証可能性と撤退基準の明確さにあります。"),
  };
}

export function buildExamResult(evaluation: ExamEvaluation): ExamResult {
  const predicted_deviation = calculatePredictedDeviation(evaluation.total_score);
  const qualified = predicted_deviation >= 50;
  return {
    ...evaluation,
    predicted_deviation,
    qualified,
    rank: qualified ? "Challenger" : "Visitor",
    rating: qualified ? 1500 : 0,
  };
}
