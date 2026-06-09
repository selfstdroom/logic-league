import type { CSSProperties } from "react";

export type PremiumAvatarSize = "small" | "medium" | "large" | "profile";

type PremiumAvatarProps = {
  avatarUrl?: string | null;
  displayName?: string | null;
  username?: string | null;
  rank?: string | null;
  size?: PremiumAvatarSize;
  className?: string;
};

type RankFrame = {
  ring: string;
  ringHi: string;
  ringLo: string;
  accent: string;
  text: string;
};

const sizeClasses: Record<PremiumAvatarSize, { frame: string; text: string }> = {
  small: { frame: "h-8 w-8", text: "text-[1rem]" },
  medium: { frame: "h-12 w-12", text: "text-[1.55rem]" },
  large: { frame: "h-24 w-24", text: "text-[3.25rem]" },
  profile: { frame: "h-32 w-32", text: "text-[4.35rem]" },
};

const rankFrames: Record<string, RankFrame> = {
  Visitor: {
    ring: "#8f98a7",
    ringHi: "#d4d9e2",
    ringLo: "#46505f",
    accent: "rgba(148,163,184,0.26)",
    text: "#e5e7eb",
  },
  Challenger: {
    ring: "#a07145",
    ringHi: "#d8a76d",
    ringLo: "#4b5563",
    accent: "rgba(180,112,54,0.3)",
    text: "#f5d0a4",
  },
  Analyst: {
    ring: "#9bb3d8",
    ringHi: "#f4f7fb",
    ringLo: "#3b82f6",
    accent: "rgba(96,165,250,0.28)",
    text: "#dbeafe",
  },
  Strategist: {
    ring: "#3b82f6",
    ringHi: "#93c5fd",
    ringLo: "#1e3a8a",
    accent: "rgba(37,99,235,0.34)",
    text: "#dbeafe",
  },
  Architect: {
    ring: "#dce6f2",
    ringHi: "#ffffff",
    ringLo: "#94a3b8",
    accent: "rgba(226,232,240,0.28)",
    text: "#f8fafc",
  },
  Mastermind: {
    ring: "#d7b46a",
    ringHi: "#fff1b8",
    ringLo: "#9a6a18",
    accent: "rgba(215,180,106,0.34)",
    text: "#ffe7a3",
  },
  Oracle: {
    ring: "#8bd3ff",
    ringHi: "#f0fbff",
    ringLo: "#8b5cf6",
    accent: "rgba(139,92,246,0.36)",
    text: "#e0f2fe",
  },
};

function getFrame(rank?: string | null) {
  return rankFrames[rank ?? ""] ?? rankFrames.Visitor;
}

export function getAvatarInitial(displayName?: string | null, username?: string | null) {
  const source = displayName?.trim() || username?.trim() || "?";
  const firstCharacter = Array.from(source)[0] ?? "?";
  return firstCharacter === "?" ? firstCharacter : firstCharacter.toLocaleUpperCase();
}

export function PremiumAvatar({ avatarUrl, displayName, username, rank, size = "medium", className = "" }: PremiumAvatarProps) {
  const frame = getFrame(rank);
  const initial = getAvatarInitial(displayName, username);
  const dimensions = sizeClasses[size];
  const label = `${displayName?.trim() || username?.trim() || "Unknown user"} avatar`;
  const style = {
    "--avatar-ring": frame.ring,
    "--avatar-ring-hi": frame.ringHi,
    "--avatar-ring-lo": frame.ringLo,
    "--avatar-accent": frame.accent,
    "--avatar-text": frame.text,
    background: `linear-gradient(135deg, ${frame.ringHi} 0%, ${frame.ring} 44%, ${frame.ringLo} 100%)`,
    boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 10px 34px ${frame.accent}, inset 0 1px 0 rgba(255,255,255,0.48)`,
  } as CSSProperties & Record<string, string>;

  return (
    <div className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full p-[2px] ${dimensions.frame} ${className}`} style={style} aria-label={label}>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={label} className="h-full w-full rounded-full object-cover" />
      ) : (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[radial-gradient(circle_at_34%_18%,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_72%_76%,var(--avatar-accent),transparent_52%),linear-gradient(145deg,#05070d_0%,#08111f_48%,#020204_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-16px_30px_rgba(0,0,0,0.62)]">
          <div className="pointer-events-none absolute inset-[17%] rounded-full border border-white/[0.055] shadow-[inset_0_10px_22px_rgba(0,0,0,0.42)]" />
          <span className={`relative select-none font-serif font-black leading-none tracking-[-0.08em] text-[var(--avatar-text)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] ${dimensions.text}`} style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", "Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", serif' }}>
            {initial}
          </span>
          <span className="pointer-events-none absolute inset-x-[22%] top-[10%] h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
        </div>
      )}
    </div>
  );
}
