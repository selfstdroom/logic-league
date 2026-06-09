import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PremiumAvatar } from "@/components/ui/PremiumAvatar";
import { HeroPanel, PageShell, PremiumBadge, SectionHeader, StatCard } from "@/components/ui/DesignSystem";
import { achievementDefinitions } from "@/lib/achievements";
import { RANK_DEFINITIONS, getRankByRating } from "@/lib/rank";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createPreview, formatDateTime } from "@/lib/topics/format";
import type { Profile, RankName } from "@/types/logic-league";

type ProfileVisibilityKey = "show_competitive_history_public" | "show_achievements_public";
type ProfileWithVisibility = Profile & Partial<Record<ProfileVisibilityKey, boolean | null>>;

type RatingHistoryRow = {
  old_rating: number | null;
  new_rating: number | null;
};

type AchievementRow = {
  achievement_key: string | null;
  achievement_id: string | null;
};

type FameRow = {
  id: string;
  final_score: number | null;
  ai_total_score: number | null;
  vote_count: number | null;
  created_at: string;
  topics?: { title?: string | null; publish_at?: string | null } | { title?: string | null; publish_at?: string | null }[] | null;
  topic_answers?: { content?: string | null } | { content?: string | null }[] | null;
};

const collectionRanks = ["Challenger", "Analyst", "Strategist", "Architect", "Mastermind", "Oracle"] as const;

const rankAssets: Record<(typeof collectionRanks)[number], string> = {
  Challenger: "/ranks/challenger.png",
  Analyst: "/ranks/analyst.png",
  Strategist: "/ranks/strategist.png",
  Architect: "/ranks/architect.png",
  Mastermind: "/ranks/mastermind.png",
  Oracle: "/ranks/oracle.png",
};

const collectionAchievements = [
  { title: "初参加", label: "Entry", keys: ["FIRST_WEEKLY"] },
  { title: "初回答", label: "Answer", keys: ["FIRST_ANSWER"] },
  { title: "初勝利", label: "Victory", keys: ["FIRST_WIN"] },
  { title: "Top10入り", label: "Top 10", keys: ["TOP10"] },
  { title: "Architect到達", label: "Rank", keys: ["ARCHITECT_REACHED"] },
  { title: "Mastermind到達", label: "Rank", keys: ["MASTERMIND_REACHED"] },
  { title: "Oracle到達", label: "Rank", keys: ["ORACLE_REACHED"] },
  { title: "Hall of Fame入り", label: "Fame", keys: ["HOF_FIRST", "HOF_X3", "HOF_X10"] },
];

const futureTitles = ["都市設計士", "教育論者", "AI戦略家", "人口問題マスター"];

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function rankOrderIndex(rank: RankName | string | null | undefined) {
  return collectionRanks.findIndex((item) => item === rank);
}

function isVisible(profile: ProfileWithVisibility, key: ProfileVisibilityKey, isOwnProfile: boolean) {
  if (isOwnProfile) return true;
  return profile[key] !== false;
}

function achievementDescription(keys: string[]) {
  return achievementDefinitions.find((definition) => keys.includes(definition.key))?.description ?? "条件達成で解放されます。";
}

function CollectionCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-12 items-center justify-center rounded-full border border-amber-200/45 bg-[linear-gradient(180deg,#f0d184_0%,#b98728_100%)] px-5 py-2 text-sm font-black text-[#171107] shadow-[0_16px_44px_rgba(185,135,40,0.22),inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-200/45">
      {children}
    </Link>
  );
}

export async function CollectionRoom({ profile: rawProfile, viewerId }: { profile: Profile; viewerId: string }) {
  const profile = rawProfile as ProfileWithVisibility;
  const isOwnProfile = viewerId === profile.id;
  const supabase = await createClient();
  const readClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;
  const showCompetitive = isVisible(profile, "show_competitive_history_public", isOwnProfile);
  const showAchievements = isVisible(profile, "show_achievements_public", isOwnProfile);

  const [{ data: ratingHistories }, { data: achievements }, { data: fameRows, count: hallOfFameCount }] = await Promise.all([
    readClient.from("rating_histories").select("old_rating, new_rating").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(100),
    showAchievements ? readClient.from("user_achievements").select("achievement_key, achievement_id").eq("user_id", profile.id) : Promise.resolve({ data: [] as AchievementRow[] }),
    readClient
      .from("hall_of_fame")
      .select("id, final_score, ai_total_score, vote_count, created_at, topics(title, publish_at), topic_answers:topic_answers!hall_of_fame_winner_answer_id_fkey(content)", { count: "exact" })
      .eq("winner_user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const ratingRows = (ratingHistories ?? []) as RatingHistoryRow[];
  const highestRating = Math.max(profile.rating, 0, ...ratingRows.flatMap((row) => [row.old_rating ?? 0, row.new_rating ?? 0]));
  const highestRank = getRankByRating(highestRating, true);
  const highestRankIndex = rankOrderIndex(highestRank);
  const earnedAchievementKeys = new Set(((achievements ?? []) as AchievementRow[]).flatMap((row) => [row.achievement_key, row.achievement_id].filter(Boolean) as string[]));
  const fameItems = (fameRows ?? []) as FameRow[];
  const achievementUnlockCount = collectionAchievements.filter((item) => item.keys.some((key) => earnedAchievementKeys.has(key))).length;

  return (
    <PageShell className="max-w-7xl">
      <HeroPanel
        eyebrow="Collection Room"
        title="コレクションルーム"
        actions={
          <>
            <CollectionCta href={isOwnProfile ? "/profile" : `/profile/${profile.username}`}>プロフィールへ戻る</CollectionCta>
            <Link href="/hall-of-fame" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] px-5 py-2 text-sm font-black text-white transition hover:border-amber-300/35 hover:bg-white/[0.09]">
              殿堂を見る
            </Link>
          </>
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <PremiumAvatar avatarUrl={profile.avatar_url} displayName={profile.display_name} username={profile.username} rank={profile.rank} size="medium" />
          <div>
            <p className="font-black text-white">{profile.display_name ?? profile.username}</p>
            <p className="text-sm text-league-muted">@{profile.username}</p>
            <p className="mt-2">Rank Badge、実績、Hall of Fame、称号を飾るトロフィールームです。解放済みは金と銀の輝きで、未解放は次の目標として展示されます。</p>
          </div>
        </div>
      </HeroPanel>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-8 lg:grid-cols-4">
        <StatCard label="Current Rank" value={profile.rank} tone="gold" />
        <StatCard label="Highest Rank" value={showCompetitive ? highestRank : "非公開"} />
        <StatCard label="Achievements" value={showAchievements ? `${achievementUnlockCount}/${collectionAchievements.length}` : "非公開"} tone="emerald" />
        <StatCard label="Hall of Fame" value={hallOfFameCount ?? 0} tone="gold" />
      </section>

      <section className="mt-6 lg:mt-10">
        <SectionHeader eyebrow="Rank Badges" title="Rank Badge コレクション">
          到達済みRankは通常表示、未解放Rankはグレースケールで展示します。バッジ画像は既存アセットをそのまま使用しています。
        </SectionHeader>
        <div className="-mx-3 mt-4 flex snap-x gap-3 overflow-x-auto px-3 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-6">
          {collectionRanks.map((rank) => {
            const unlocked = showCompetitive && highestRankIndex >= rankOrderIndex(rank);
            const definition = RANK_DEFINITIONS.find((item) => item.name === rank);
            return (
              <Card key={rank} className={`min-w-[11.5rem] snap-start p-4 text-center sm:min-w-0 ${unlocked ? "border-amber-300/28 bg-[radial-gradient(circle_at_top,rgba(215,180,106,0.18),transparent_48%),rgba(255,255,255,0.055)]" : "border-white/8 bg-white/[0.03] opacity-60 grayscale"}`}>
                <div className="mx-auto flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
                  <Image src={rankAssets[rank]} alt={`${rank} rank badge`} width={132} height={132} className="h-full w-full object-contain" />
                </div>
                <h3 className="mt-3 text-base font-black text-white">{rank}</h3>
                <p className="mt-1 text-[0.68rem] font-black uppercase tracking-[0.18em] text-league-muted">{definition?.range}</p>
                <div className="mt-3">
                  {unlocked ? <PremiumBadge tone="gold">解放済み</PremiumBadge> : <PremiumBadge>未解放</PremiumBadge>}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <Card>
          <SectionHeader eyebrow="Achievements" title="実績コレクション">
            指定実績をカード化し、獲得済みはハイライト、未達成は暗めに表示します。
          </SectionHeader>
          {showAchievements ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {collectionAchievements.map((achievement) => {
                const unlocked = achievement.keys.some((key) => earnedAchievementKeys.has(key));
                return (
                  <div key={achievement.title} className={`rounded-[1.35rem] border p-4 transition ${unlocked ? "border-amber-300/30 bg-[radial-gradient(circle_at_top_right,rgba(215,180,106,0.18),transparent_42%),rgba(215,180,106,0.08)] shadow-[0_18px_60px_rgba(215,180,106,0.08)]" : "border-white/10 bg-black/24 opacity-65"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-sm font-black tracking-[0.18em] ${unlocked ? "border-amber-200/35 bg-amber-300/14 text-league-gold" : "border-white/10 bg-white/[0.045] text-league-muted"}`}>{achievement.label}</div>
                      {unlocked ? <PremiumBadge tone="gold">達成</PremiumBadge> : <PremiumBadge>未達成</PremiumBadge>}
                    </div>
                    <h3 className="mt-4 text-lg font-black text-white">{achievement.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-league-silver">{achievementDescription(achievement.keys)}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState kind="achievements" title="実績は非公開です。">このユーザーは実績の公開をオフにしています。</EmptyState>
          )}
        </Card>

        <Card className="border-amber-300/22 bg-[radial-gradient(circle_at_top,rgba(215,180,106,0.14),transparent_44%),linear-gradient(145deg,rgba(255,255,255,0.065),rgba(8,13,26,0.8))]">
          <SectionHeader eyebrow="Hall of Fame Collection" title="殿堂入りコレクション" />
          <div className="mt-4 rounded-[1.6rem] border border-amber-300/25 bg-black/25 p-5 text-center">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-league-muted">Hall of Fame Count</p>
            <p className="mt-2 text-5xl font-black text-league-gold">{hallOfFameCount ?? 0}</p>
            <p className="mt-2 text-sm font-bold text-league-silver">Hall of Fame Badge</p>
          </div>
          {fameItems.length > 0 ? (
            <div className="mt-4 space-y-3">
              {fameItems.map((item) => {
                const topic = first(item.topics);
                const answer = first(item.topic_answers);
                return (
                  <Link key={item.id} href={`/hall-of-fame/${item.id}`} className="block rounded-[1.25rem] border border-white/10 bg-black/25 p-4 transition hover:border-amber-300/35 hover:bg-white/[0.06]">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="min-w-0 truncate font-black text-white">{topic?.title ?? "Hall of Fame Answer"}</h3>
                      <span className="shrink-0 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-black text-league-gold">{item.final_score ?? "—"}</span>
                    </div>
                    <p className="mt-1 text-xs text-league-muted">{formatDateTime(topic?.publish_at ?? item.created_at)}</p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-league-silver">{createPreview(answer?.content ?? "", 150)}</p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState kind="achievements" title="まだ殿堂入り回答はありません。">まだ殿堂入り回答はありません。競技議論で優れた回答を目指しましょう。</EmptyState>
          )}
        </Card>
      </section>

      <section className="mt-8">
        <Card>
          <SectionHeader eyebrow="Special Titles / Future Area" title="称号コレクション">
            今後のテーマ別称号を展示するための準備エリアです。現在はロック中のプレースホルダーとして表示します。
          </SectionHeader>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {futureTitles.map((title) => (
              <div key={title} className="rounded-[1.35rem] border border-white/10 bg-black/25 p-5 opacity-65">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-league-muted">Locked Title</p>
                <h3 className="mt-3 text-lg font-black text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-league-silver">今後のイベントやテーマ別実績で解放予定です。</p>
                <div className="mt-4"><PremiumBadge>未解放</PremiumBadge></div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
