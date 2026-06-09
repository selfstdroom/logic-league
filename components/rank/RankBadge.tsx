import Image from "next/image";
import type { RankName } from "@/types/logic-league";

const rankBadgeImages = {
  Challenger: "/ranks/challenger.png",
  Analyst: "/ranks/analyst.png",
  Strategist: "/ranks/strategist.png",
  Architect: "/ranks/architect.png",
  Mastermind: "/ranks/mastermind.png",
  Oracle: "/ranks/oracle.png",
} as const;

type BadgeRankName = keyof typeof rankBadgeImages;
type RankBadgeSize = "xs" | "sm" | "md" | "lg" | "small" | "medium" | "large" | "profile";

type RankBadgeProps = {
  rank?: RankName | string | null;
  size?: RankBadgeSize;
  showLabel?: boolean;
  labelPlacement?: "side" | "bottom";
  className?: string;
};

const sizes: Record<RankBadgeSize, { pixels: number; box: string; label: string; detail: string }> = {
  xs: { pixels: 32, box: "h-8 w-8", label: "text-[0.62rem]", detail: "text-[0.55rem]" },
  small: { pixels: 32, box: "h-8 w-8", label: "text-[0.62rem]", detail: "text-[0.55rem]" },
  sm: { pixels: 48, box: "h-12 w-12", label: "text-xs", detail: "text-[0.6rem]" },
  medium: { pixels: 48, box: "h-12 w-12", label: "text-xs", detail: "text-[0.6rem]" },
  md: { pixels: 96, box: "h-24 w-24", label: "text-sm", detail: "text-xs" },
  large: { pixels: 96, box: "h-24 w-24", label: "text-sm", detail: "text-xs" },
  lg: { pixels: 140, box: "h-28 w-28 max-w-full sm:h-[140px] sm:w-[140px]", label: "text-base", detail: "text-xs" },
  profile: { pixels: 140, box: "h-28 w-28 max-w-full sm:h-[140px] sm:w-[140px]", label: "text-base", detail: "text-xs" },
};

function hasBadgeImage(rank?: RankName | string | null): rank is BadgeRankName {
  return Boolean(rank && rank in rankBadgeImages);
}

function displayRank(rank?: RankName | string | null) {
  return rank?.trim() || "Visitor";
}

export function RankBadge({ rank, size = "medium", showLabel = false, labelPlacement = "side", className = "" }: RankBadgeProps) {
  const label = displayRank(rank);
  const sizeClasses = sizes[size];
  const isBottomLabel = labelPlacement === "bottom";

  if (!hasBadgeImage(rank)) {
    return showLabel ? (
      <div className={`inline-flex ${isBottomLabel ? "flex-col items-center gap-1" : "items-center gap-2"} ${className}`}>
        <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs font-black text-league-silver">{label}</span>
        {isBottomLabel ? <span className={`${sizeClasses.detail} uppercase tracking-[0.2em] text-league-muted`}>Rank区分</span> : null}
      </div>
    ) : null;
  }

  const src = rankBadgeImages[rank];

  return (
    <div className={`inline-flex min-w-0 ${isBottomLabel ? "flex-col items-center gap-1.5" : "items-center gap-3"} ${className}`}>
      <div className={`relative shrink-0 overflow-visible ${sizeClasses.box}`}>
        <Image
          src={src}
          alt={`${label} rank badge`}
          width={sizeClasses.pixels}
          height={sizeClasses.pixels}
          sizes={`${sizeClasses.pixels}px`}
          className="h-full w-full object-contain"
          priority={size === "profile" || size === "lg"}
        />
      </div>
      {showLabel ? (
        <div className={isBottomLabel ? "min-w-0 text-center" : "min-w-0"}>
          <p className={`${sizeClasses.label} font-black tracking-[0.18em] text-league-gold`}>{label}</p>
          <p className={`${isBottomLabel ? `mt-0.5 ${sizeClasses.detail}` : "mt-1 text-xs"} uppercase tracking-[0.2em] text-league-muted`}>Rank区分</p>
        </div>
      ) : null}
    </div>
  );
}
