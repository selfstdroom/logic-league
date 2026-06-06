import { achievementDefinitions } from "@/lib/achievements";
import type { ArchetypeName, RankName } from "@/types/logic-league";

export type EarnedTitleOption = { value: string; label: string; source: string };

const rankTitleMap: Partial<Record<RankName, string>> = {
  Architect: "Architect到達",
  Oracle: "Oracle候補",
  Mastermind: "Mastermind到達",
  Strategist: "Strategist到達",
  Analyst: "Analyst到達",
};

const archetypeTitleMap: Partial<Record<ArchetypeName, string>> = {
  Architect: "構造化型",
  Strategist: "仮説構築型",
  Analyst: "現実重視型",
  Builder: "現実重視型",
  Oracle: "Oracle候補",
};

const rankOrder: RankName[] = ["Visitor", "Challenger", "Analyst", "Strategist", "Architect", "Mastermind", "Oracle", "Official"];

function rankReached(current: RankName | null | undefined, target: RankName) {
  return rankOrder.indexOf(current ?? "Visitor") >= rankOrder.indexOf(target);
}

function addUnique(options: EarnedTitleOption[], option: EarnedTitleOption) {
  if (!options.some((existing) => existing.value === option.value)) options.push(option);
}

export function buildEarnedTitleOptions(params: { qualified: boolean; rank: RankName; archetype: ArchetypeName | null; achievementKeys: Set<string> }) {
  const options: EarnedTitleOption[] = [];
  if (params.qualified) addUnique(options, { value: "certified_player", label: "認定プレイヤー", source: "認定試験" });

  for (const definition of achievementDefinitions) {
    if (!params.achievementKeys.has(definition.key)) continue;
    addUnique(options, { value: `achievement:${definition.key}`, label: definition.title, source: "獲得実績" });
  }

  if (rankReached(params.rank, "Architect")) addUnique(options, { value: "rank:architect", label: "Architect到達", source: "Rank" });
  if (rankReached(params.rank, "Oracle")) addUnique(options, { value: "rank:oracle_candidate", label: "Oracle候補", source: "Rank" });

  const mappedRankTitle = rankTitleMap[params.rank];
  if (mappedRankTitle) addUnique(options, { value: `rank:${params.rank}`, label: mappedRankTitle, source: "Rank" });

  const mappedArchetypeTitle = params.archetype ? archetypeTitleMap[params.archetype] : null;
  if (mappedArchetypeTitle) addUnique(options, { value: `archetype:${params.archetype}`, label: mappedArchetypeTitle, source: "認定タイプ" });

  return options;
}

export function resolveDisplayTitle(displayTitle: string | null | undefined, options: EarnedTitleOption[]) {
  return options.find((option) => option.value === displayTitle) ?? options[0] ?? null;
}
