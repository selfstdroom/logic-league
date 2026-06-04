import type { ReactNode, SVGProps } from "react";

export type LeagueIconName =
  | "home"
  | "timeline"
  | "search"
  | "profile"
  | "settings"
  | "notifications"
  | "bookmarks"
  | "achievements"
  | "hallOfFame"
  | "leaderboard"
  | "weeklyLeague"
  | "dailyDiscussions"
  | "answer"
  | "counter"
  | "support"
  | "question"
  | "comment"
  | "rankUp";

type LeagueIconProps = SVGProps<SVGSVGElement> & {
  name: LeagueIconName;
  size?: number;
};

const paths: Record<LeagueIconName, ReactNode> = {
  home: <><path d="M5 11.5 12 5l7 6.5" /><path d="M7.5 10.5V19h9v-8.5" /><path d="M10.25 19v-5h3.5v5" /></>,
  timeline: <><path d="M7 5v14" /><path d="M7 8h9.5" /><path d="M7 12h7" /><path d="M7 16h10" /><circle cx="7" cy="8" r="2" /><circle cx="7" cy="16" r="2" /></>,
  search: <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4 4" /></>,
  profile: <><circle cx="12" cy="8.2" r="3.2" /><path d="M5.5 19c.8-3.4 3-5.1 6.5-5.1s5.7 1.7 6.5 5.1" /></>,
  settings: <><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" /><path d="M12 3.8v2.1M12 18.1v2.1M5.1 7.8l1.8 1M17.1 15.2l1.8 1M5.1 16.2l1.8-1M17.1 8.8l1.8-1" /></>,
  notifications: <><path d="M8 10a4 4 0 0 1 8 0v3.4l1.7 2.5H6.3L8 13.4Z" /><path d="M10 18.3a2.2 2.2 0 0 0 4 0" /></>,
  bookmarks: <><path d="M7.5 5.5h9v14L12 16.7l-4.5 2.8Z" /></>,
  achievements: <><path d="M8 5.5h8v5.2a4 4 0 0 1-8 0Z" /><path d="M8 7H5.5v1.8A3.2 3.2 0 0 0 8 12" /><path d="M16 7h2.5v1.8A3.2 3.2 0 0 1 16 12" /><path d="M12 14.7v3.1" /><path d="M8.5 19h7" /></>,
  hallOfFame: <><path d="M5 19h14" /><path d="M7 16.5V10l5-4 5 4v6.5" /><path d="M9.5 16.5v-5h5v5" /><path d="M12 6v10.5" /></>,
  leaderboard: <><path d="M5.5 19V12h4v7" /><path d="M10 19V6h4v13" /><path d="M14.5 19v-9h4v9" /><path d="M4 19h16" /></>,
  weeklyLeague: <><path d="M6.5 8.5 12 5l5.5 3.5v7L12 19l-5.5-3.5Z" /><path d="m9 12 2 2 4-4" /></>,
  dailyDiscussions: <><path d="M6 6.5h12v8H9l-3 3Z" /><path d="M9 10h6" /><path d="M9 12.8h4" /></>,
  answer: <><path d="M6 5.5h12v10H9l-3 3Z" /><path d="M9 9h6" /><path d="M9 12h4" /></>,
  counter: <><path d="M7 17 17 7" /><path d="m8 7 9 9" /><path d="M6 6h4v4" /><path d="M18 18h-4v-4" /></>,
  support: <><path d="m5.5 12 4 4L18.5 7" /><path d="M7 7.5h5" /></>,
  question: <><path d="M9 9a3 3 0 1 1 4.2 2.8c-.9.4-1.2.9-1.2 1.9" /><path d="M12 18h.01" /></>,
  comment: <><path d="M6 6h12v8.5H9.5L6 18Z" /><path d="M9 9.5h6" /><path d="M9 12h4" /></>,
  rankUp: <><path d="m12 5 5.5 5.5H14V19h-4v-8.5H6.5Z" /></>,
};

export function LeagueIcon({ name, size = 20, className = "", ...props }: LeagueIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
