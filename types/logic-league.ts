export const ARCHETYPE_NAMES = [
  "Architect",
  "Strategist",
  "Analyst",
  "Challenger",
  "Builder",
  "Oracle",
  "Diplomat",
  "Explorer",
  "Reformer",
  "Synthesizer",
  "Commander",
  "Researcher",
  "Economist",
  "Philosopher",
  "Negotiator",
  "Visionary",
] as const;

export type ArchetypeName = (typeof ARCHETYPE_NAMES)[number];
export type RankName = "Visitor" | "Challenger" | "Analyst" | "Strategist" | "Architect" | "Mastermind" | "Oracle";

export type ExamScores = {
  structure_score: number;
  hypothesis_score: number;
  originality_score: number;
  feasibility_score: number;
  risk_score: number;
  total_score: number;
};

export type ExamEvaluation = ExamScores & {
  archetype: ArchetypeName;
  headline: string;
  summary: string;
  strength: string;
  weakness: string;
  upper_gap: string;
};

export type ExamResult = ExamEvaluation & {
  predicted_deviation: number;
  qualified: boolean;
  rank: RankName;
  rating: number;
};

export type Profile = {
  id: string;
  email: string | null;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  predicted_deviation: number | null;
  qualified: boolean;
  rating: number;
  rank: RankName;
  archetype: ArchetypeName | null;
  x_url: string | null;
  youtube_url: string | null;
  github_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ExamAnswer = {
  id: string;
  user_id: string;
  answer: string;
  created_at: string;
} & ExamResult;

export type UserSettings = {
  user_id: string;
  privacy_profile_public: boolean;
  privacy_thought_log_public: boolean;
  privacy_exam_results_public: boolean;
  privacy_stats_public: boolean;
  privacy_achievements_public: boolean;
  notify_comments: boolean;
  notify_likes: boolean;
  notify_weekly_results: boolean;
  notify_rank_up: boolean;
  notify_achievement_unlocked: boolean;
  notify_hall_of_fame: boolean;
  theme: "dark" | "light" | "system";
  display_density: "standard" | "compact";
  created_at: string;
  updated_at: string;
};
