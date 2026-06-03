import type { RankName } from "@/types/logic-league";

const rankThemes: Record<RankName, { metal: string; glow: string; crown?: boolean; points: string; label: string; rim: string; core: string; accent: string }> = {
  Visitor: {
    metal: "from-slate-700 via-slate-400 to-slate-900",
    glow: "shadow-slate-400/20",
    points: "42,6 76,18 86,52 64,86 22,86 0,52 10,18",
    label: "Visitor",
    rim: "#94a3b8",
    core: "#1e293b",
    accent: "#cbd5e1",
  },
  Challenger: {
    metal: "from-amber-900 via-orange-300 to-stone-900",
    glow: "shadow-orange-400/25",
    points: "42,5 73,17 84,48 61,84 25,84 2,48 13,17",
    label: "Challenger",
    rim: "#b45309",
    core: "#431407",
    accent: "#f59e0b",
  },
  Analyst: {
    metal: "from-zinc-700 via-white to-zinc-900",
    glow: "shadow-white/20",
    points: "42,4 76,18 84,52 61,86 23,86 0,52 8,18",
    label: "Analyst",
    rim: "#e5e7eb",
    core: "#27272a",
    accent: "#f8fafc",
  },
  Strategist: {
    metal: "from-blue-950 via-slate-100 to-blue-700",
    glow: "shadow-blue-300/25",
    points: "42,3 79,17 88,50 64,88 22,88 -4,50 5,17",
    label: "Strategist",
    rim: "#93c5fd",
    core: "#0f172a",
    accent: "#60a5fa",
  },
  Architect: {
    metal: "from-slate-500 via-white to-cyan-100",
    glow: "shadow-cyan-100/25",
    points: "42,2 80,16 90,49 67,90 19,90 -6,49 4,16",
    label: "Architect",
    rim: "#f8fafc",
    core: "#164e63",
    accent: "#bae6fd",
  },
  Mastermind: {
    metal: "from-yellow-700 via-amber-200 to-zinc-100",
    glow: "shadow-amber-300/30",
    points: "42,1 82,15 92,48 68,91 18,91 -8,48 2,15",
    label: "Mastermind",
    rim: "#fde68a",
    core: "#422006",
    accent: "#d7b46a",
  },
  Oracle: {
    metal: "from-yellow-800 via-amber-100 to-yellow-500",
    glow: "shadow-amber-200/40",
    crown: true,
    points: "42,0 83,14 94,48 70,92 16,92 -10,48 1,14",
    label: "Oracle",
    rim: "#fef3c7",
    core: "#451a03",
    accent: "#facc15",
  },
};

type RankBadgeProps = {
  rank?: RankName | string | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
};

function normalizeRank(rank?: RankName | string | null): RankName {
  if (rank && rank in rankThemes) return rank as RankName;
  return "Challenger";
}

const sizes = {
  sm: { box: "h-12 w-12", text: "text-xs", label: "text-xs" },
  md: { box: "h-20 w-20", text: "text-sm", label: "text-sm" },
  lg: { box: "h-28 w-28", text: "text-base", label: "text-base" },
};

export function RankBadge({ rank, size = "md", showLabel = false, className = "" }: RankBadgeProps) {
  const safeRank = normalizeRank(rank);
  const theme = rankThemes[safeRank];
  const id = `rank-${safeRank.toLowerCase()}`;
  const sizeClasses = sizes[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className={`relative ${sizeClasses.box} drop-shadow-2xl`} aria-label={`${theme.label} rank badge`}>
        <svg viewBox="-12 -12 104 116" role="img" className="h-full w-full">
          <defs>
            <linearGradient id={`${id}-metal`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor={theme.rim} />
              <stop offset="35%" stopColor="#fff8dc" />
              <stop offset="68%" stopColor={theme.accent} />
              <stop offset="100%" stopColor={theme.core} />
            </linearGradient>
            <radialGradient id={`${id}-core`} cx="50%" cy="38%" r="64%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="45%" stopColor={theme.accent} stopOpacity="0.5" />
              <stop offset="100%" stopColor={theme.core} stopOpacity="0.96" />
            </radialGradient>
          </defs>
          {theme.crown ? <path d="M14 10 L28 -5 L42 12 L56 -5 L70 10 L66 25 L18 25 Z" fill="#d7b46a" stroke="#fff4c4" strokeWidth="2" /> : null}
          <polygon points={theme.points} fill={`url(#${id}-core)`} stroke={theme.rim} strokeOpacity="0.75" strokeWidth="2" />
          <polygon points="42,14 68,25 75,50 58,76 26,76 9,50 16,25" fill="none" stroke={theme.accent} strokeOpacity="0.9" strokeWidth="2" />
          <path d="M24 52 L42 24 L60 52 L42 67 Z" fill="none" stroke="#f8fafc" strokeOpacity="0.72" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="42" cy="51" r="7" fill={theme.accent} stroke="#fff8dc" strokeWidth="2" />
          <path d="M21 83 H63" stroke="#f8fafc" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div className={`absolute inset-2 rounded-full bg-gradient-to-br ${theme.metal} opacity-20 blur-xl ${theme.glow}`} />
      </div>
      {showLabel ? (
        <div>
          <p className={`${sizeClasses.label} font-black uppercase tracking-[0.24em] text-league-gold`}>{theme.label}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-league-muted">Rank Class</p>
        </div>
      ) : null}
    </div>
  );
}
