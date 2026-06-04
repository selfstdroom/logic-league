import { useId } from "react";
import { LeagueIcon } from "@/components/ui/LeagueIcon";

type AchievementBadgeProps = {
  label: string;
  unlocked?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-10 w-10 text-[0.64rem]",
  md: "h-14 w-14 text-[0.74rem]",
  lg: "h-20 w-20 text-sm",
};

function monogram(label: string) {
  const trimmed = label.trim();
  const numeric = trimmed.match(/\d+/)?.[0];
  if (numeric) return numeric.slice(0, 3);
  return trimmed.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "LL";
}

export function AchievementBadge({ label, unlocked = false, size = "md", className = "" }: AchievementBadgeProps) {
  const badgeLabel = monogram(label);
  const id = useId().replace(/:/g, "");
  return (
    <span className={`relative inline-flex ${sizeClasses[size]} shrink-0 items-center justify-center ${className}`} aria-label={unlocked ? `${label} unlocked achievement` : `${label} locked achievement`}>
      <svg viewBox="0 0 80 92" className="absolute inset-0 h-full w-full drop-shadow-2xl" role="img">
        <defs>
          <linearGradient id={`${id}-achievement-metal`} x1="8" x2="70" y1="4" y2="88" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={unlocked ? "#fff7d6" : "#475569"} />
            <stop offset="0.32" stopColor={unlocked ? "#d7b46a" : "#273244"} />
            <stop offset="0.66" stopColor={unlocked ? "#f8fafc" : "#111827"} />
            <stop offset="1" stopColor={unlocked ? "#7c4a03" : "#05070d"} />
          </linearGradient>
          <radialGradient id={`${id}-achievement-core`} cx="50%" cy="35%" r="65%">
            <stop offset="0" stopColor={unlocked ? "#fff9db" : "#94a3b8"} stopOpacity={unlocked ? "0.95" : "0.22"} />
            <stop offset="0.55" stopColor={unlocked ? "#b88928" : "#1f2937"} stopOpacity="0.78" />
            <stop offset="1" stopColor={unlocked ? "#271706" : "#05070d"} />
          </radialGradient>
        </defs>
        <path d="M40 3 70 16v28c0 19-12 33-30 44C22 77 10 63 10 44V16Z" fill={`url(#${id}-achievement-core)`} stroke={`url(#${id}-achievement-metal)`} strokeWidth="3" />
        <path d="M40 13 60 22v20c0 13-7 23-20 31-13-8-20-18-20-31V22Z" fill="none" stroke={unlocked ? "#fff2bd" : "#64748b"} strokeOpacity={unlocked ? "0.78" : "0.38"} strokeWidth="2" />
        <path d="M25 64h30" stroke={unlocked ? "#f8fafc" : "#64748b"} strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {unlocked ? (
        <span className="relative font-black tracking-[0.08em] text-[#111827] [text-shadow:0_1px_0_rgba(255,255,255,0.42)]">{badgeLabel}</span>
      ) : (
        <LeagueIcon name="achievements" size={size === "lg" ? 30 : 20} className="relative text-slate-500" />
      )}
      <span className={`absolute inset-1 rounded-full blur-xl ${unlocked ? "bg-amber-300/18" : "bg-slate-500/8"}`} />
    </span>
  );
}
