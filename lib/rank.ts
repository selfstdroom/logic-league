import type { RankName } from "@/types/logic-league";

export function getRankByRating(rating: number, qualified = true): RankName {
  if (!qualified) return "Visitor";
  if (rating >= 2500) return "Oracle";
  if (rating >= 2300) return "Mastermind";
  if (rating >= 2100) return "Architect";
  if (rating >= 1900) return "Strategist";
  if (rating >= 1700) return "Analyst";
  return "Challenger";
}
