export type WeeklyAnswerScore = {
  ai_structure_score: number;
  ai_logic_score: number;
  ai_originality_score: number;
  ai_feasibility_score: number;
  ai_risk_score: number;
  ai_total_score: number;
};

function clampScore(value: number) {
  return Math.max(0, Math.min(20, Math.round(value)));
}

export function scoreWeeklyAnswer(content: string): WeeklyAnswerScore {
  const length = content.trim().length;
  const paragraphs = content.split(/\n\s*\n/).filter((part) => part.trim().length > 0).length;
  const hasCounterArgument = /反論|一方|ただし|しかし|副作用|リスク|懸念|自由|義務/.test(content);
  const hasConcreteDesign = /制度|設計|条件|段階|例外|罰則|教育|参加|投票率|効果/.test(content);
  const hasCausalLanguage = /ため|結果|影響|原因|関係|向上|低下|促進|抑制/.test(content);

  const structure = clampScore(8 + Math.min(6, paragraphs * 2) + Math.min(6, length / 300));
  const logic = clampScore(8 + (hasCausalLanguage ? 5 : 0) + Math.min(7, length / 350));
  const originality = clampScore(7 + (hasConcreteDesign ? 4 : 0) + Math.min(9, new Set(content).size / 35));
  const feasibility = clampScore(7 + (hasConcreteDesign ? 6 : 0) + Math.min(7, length / 450));
  const risk = clampScore(6 + (hasCounterArgument ? 8 : 0) + Math.min(6, length / 500));
  const total = structure + logic + originality + feasibility + risk;

  return {
    ai_structure_score: structure,
    ai_logic_score: logic,
    ai_originality_score: originality,
    ai_feasibility_score: feasibility,
    ai_risk_score: risk,
    ai_total_score: total,
  };
}
