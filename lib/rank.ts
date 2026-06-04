import type { RankName } from "@/types/logic-league";

export type RankDefinition = {
  name: RankName;
  min: number;
  max: number | null;
  range: string;
  description: string;
};

export const RANK_DEFINITIONS: RankDefinition[] = [
  { name: "Official", min: 0, max: null, range: "運営", description: "Logic League運営による公式サンプル・案内用アカウント" },
  { name: "Visitor", min: 0, max: 1499, range: "0–1499", description: "認定前、または競技参加を始めたばかりの観察者" },
  { name: "Challenger", min: 1500, max: 1699, range: "1500–1699", description: "知的競技に挑み始めた参加者" },
  { name: "Analyst", min: 1700, max: 1899, range: "1700–1899", description: "論点分析と根拠整理に優れる" },
  { name: "Strategist", min: 1900, max: 2099, range: "1900–2099", description: "戦略構築に優れる" },
  { name: "Architect", min: 2100, max: 2299, range: "2100–2299", description: "構造設計に優れる" },
  { name: "Mastermind", min: 2300, max: 2499, range: "2300–2499", description: "高次の仮説統合に優れる" },
  { name: "Oracle", min: 2500, max: null, range: "2500+", description: "最上位層の思考家" },
];

export function getRankByRating(rating: number, qualified = true): RankName {
  if (!qualified) return "Visitor";
  if (rating >= 2500) return "Oracle";
  if (rating >= 2300) return "Mastermind";
  if (rating >= 2100) return "Architect";
  if (rating >= 1900) return "Strategist";
  if (rating >= 1700) return "Analyst";
  if (rating >= 1500) return "Challenger";
  return "Visitor";
}

export function getRankDefinition(rank: RankName | string | null | undefined) {
  return RANK_DEFINITIONS.find((definition) => definition.name === rank) ?? RANK_DEFINITIONS.find((definition) => definition.name === "Visitor") ?? RANK_DEFINITIONS[0];
}

export function getNextRank(rating: number, qualified = true) {
  const current = getRankByRating(rating, qualified);
  const currentIndex = RANK_DEFINITIONS.findIndex((definition) => definition.name === current);
  return currentIndex >= 0 ? RANK_DEFINITIONS[currentIndex + 1] ?? null : RANK_DEFINITIONS[1];
}

export function getRankProgress(rating: number, qualified = true) {
  const current = getRankDefinition(getRankByRating(rating, qualified));
  const next = getNextRank(rating, qualified);
  if (!next || current.max === null) return 100;
  const base = current.name === "Visitor" ? 0 : current.min;
  const span = Math.max(1, next.min - base);
  return Math.max(0, Math.min(100, Math.round(((rating - base) / span) * 100)));
}
