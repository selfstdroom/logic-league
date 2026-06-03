import OpenAI from "openai";
import { normalizeExamEvaluation } from "@/lib/scoring";
import type { ExamEvaluation } from "@/types/logic-league";

const examPrompt = `あなたはLogic Leagueの認定試験を採点する評価AIです。

Logic Leagueは、知識量ではなく課題解決力・構造化能力・仮説構築力・独創性・実現可能性・リスク分析力を評価する知的競技プラットフォームです。

この試験はIQ検査ではありません。正式な心理検査でもありません。回答者の思考傾向をAIが推定するものです。

以下の回答を5項目それぞれ20点満点で採点してください。
採点項目: 構造化能力、仮説構築力、独創性、実現可能性、リスク分析。

採点時の注意:
- 長文であること自体を高評価にしない
- 綺麗な文章であること自体を高評価にしない
- 一般論だけの回答は低評価
- 精神論だけの回答は低評価
- 具体性のない網羅的回答は低評価
- 回答者の立場ではなく、回答内容だけを見る
- AIっぽい文体でも内容が優れていれば評価する
- 内容が薄い場合は厳しく評価する

思考アーキタイプは以下16種類から1つだけ選んでください。
Architect, Strategist, Analyst, Challenger, Builder, Oracle, Diplomat, Explorer, Reformer, Synthesizer, Commander, Researcher, Economist, Philosopher, Negotiator, Visionary

出力は必ず次のキーを持つJSONオブジェクトだけにしてください。
{
  "structure_score": number,
  "hypothesis_score": number,
  "originality_score": number,
  "feasibility_score": number,
  "risk_score": number,
  "total_score": number,
  "archetype": string,
  "headline": "読んで気持ちよくなる一言キャッチ",
  "summary": "回答者の思考特徴を具体的に褒めつつ分析する総評",
  "strength": "最も強かった点",
  "weakness": "改善点",
  "upper_gap": "上位層との差"
}`;

const mockExamEvaluation: ExamEvaluation = {
  structure_score: 14,
  hypothesis_score: 13,
  originality_score: 12,
  feasibility_score: 15,
  risk_score: 11,
  total_score: 65,
  archetype: "Architect",
  headline: "あなたは、問題を構造から捉えるタイプです。",
  summary: "回答は人口減少を単なる現象ではなく、若者流出と地域経済の構造問題として捉えています。",
  strength: "問題を分解し、施策に優先順位をつけている点。",
  weakness: "失敗時の検証設計がやや弱い点。",
  upper_gap: "上位層との差は、撤退基準と効果測定の具体性です。",
};

function isMockAiScoringEnabled() {
  return process.env.MOCK_AI_SCORING === "true";
}

export async function gradeExamAnswer(answer: string): Promise<ExamEvaluation> {
  if (isMockAiScoringEnabled()) {
    return mockExamEvaluation;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    response_format: { type: "json_object" },
    temperature: 0.2,
    messages: [
      { role: "system", content: examPrompt },
      { role: "user", content: `認定試験の回答:\n\n${answer}` },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAIから採点結果が返りませんでした。");

  try {
    return normalizeExamEvaluation(JSON.parse(content));
  } catch (error) {
    throw new Error(`AI採点結果のJSON解析に失敗しました: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}
