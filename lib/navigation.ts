import type { LeagueIconName } from "@/components/ui/LeagueIcon";
import type { PrimaryNavItem } from "@/components/layout/ResponsiveNavigation";

export type NavigationItemId =
  | "home"
  | "timeline"
  | "search"
  | "profile"
  | "settings"
  | "topics"
  | "weekly"
  | "leaderboard"
  | "hall-of-fame"
  | "collection"
  | "notifications";

export type NavigationConfig = {
  selectedIds: NavigationItemId[];
};

export const NAV_CONFIG_STORAGE_KEY = "logic-league-nav-config";

export const defaultNavigationIds: NavigationItemId[] = ["home", "timeline", "search", "profile", "settings"];

export const navigationItems: Record<NavigationItemId, PrimaryNavItem & { id: NavigationItemId; englishLabel: string; description: string }> = {
  home: { id: "home", href: "/home", label: "ホーム", shortLabel: "Home", englishLabel: "Home", icon: "home" as LeagueIconName, description: "メインフィードと導線" },
  timeline: { id: "timeline", href: "/timeline", label: "タイムライン", shortLabel: "Timeline", englishLabel: "Timeline", icon: "timeline" as LeagueIconName, description: "投稿・活動の流れ" },
  search: { id: "search", href: "/search", label: "検索", shortLabel: "Search", englishLabel: "Search", icon: "search" as LeagueIconName, description: "議論・ユーザー検索" },
  profile: { id: "profile", href: "/profile", label: "マイページ", shortLabel: "Profile", englishLabel: "Profile", icon: "profile" as LeagueIconName, description: "自分のプロフィール" },
  settings: { id: "settings", href: "/settings", label: "設定", shortLabel: "Settings", englishLabel: "Settings", icon: "settings" as LeagueIconName, description: "体験とアカウント管理" },
  topics: { id: "topics", href: "/topics", label: "議論", shortLabel: "議論", englishLabel: "Discussions", icon: "dailyDiscussions" as LeagueIconName, description: "Daily / Special 議論" },
  weekly: { id: "weekly", href: "/weekly", label: "競技議論", shortLabel: "競技", englishLabel: "Competitive", icon: "weeklyLeague" as LeagueIconName, description: "Weekly League" },
  leaderboard: { id: "leaderboard", href: "/leaderboard", label: "ランキング", shortLabel: "Rank", englishLabel: "Leaderboard", icon: "leaderboard" as LeagueIconName, description: "Rating順位" },
  "hall-of-fame": { id: "hall-of-fame", href: "/hall-of-fame", label: "殿堂", shortLabel: "殿堂", englishLabel: "Hall of Fame", icon: "hallOfFame" as LeagueIconName, description: "優秀回答アーカイブ" },
  collection: { id: "collection", href: "/profile/collection", label: "コレクション", shortLabel: "収集", englishLabel: "Collection Room", icon: "achievements" as LeagueIconName, description: "実績・称号の部屋" },
  notifications: { id: "notifications", href: "/notifications", label: "通知", shortLabel: "通知", englishLabel: "Notifications", icon: "notifications" as LeagueIconName, description: "通知センター" },
};

export const allNavigationIds = Object.keys(navigationItems) as NavigationItemId[];

export function normalizeNavigationIds(ids: unknown): NavigationItemId[] {
  const input = Array.isArray(ids) ? ids : defaultNavigationIds;
  const unique = input.filter((id): id is NavigationItemId => typeof id === "string" && id in navigationItems).filter((id, index, array) => array.indexOf(id) === index);
  const clipped = unique.slice(0, 5);
  const withMinimum = clipped.length >= 3 ? clipped : defaultNavigationIds;
  return withMinimum.slice(0, 5);
}

export function itemsFromIds(ids: NavigationItemId[]): PrimaryNavItem[] {
  return normalizeNavigationIds(ids).map((id) => navigationItems[id]);
}

export function parseStoredNavigation(raw: string | null): NavigationItemId[] {
  if (!raw) return defaultNavigationIds;
  try {
    const parsed = JSON.parse(raw) as Partial<NavigationConfig> | NavigationItemId[];
    return normalizeNavigationIds(Array.isArray(parsed) ? parsed : parsed.selectedIds);
  } catch {
    return defaultNavigationIds;
  }
}
