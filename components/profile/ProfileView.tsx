import Link from "next/link";
import { AnswerHistory, type AnswerHistoryItem } from "@/components/profile/AnswerHistory";
import { RankBadge } from "@/components/rank/RankBadge";
import { RankProgress } from "@/components/rank/RankProgress";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader, StatCard } from "@/components/ui/DesignSystem";
import { createClient } from "@/lib/supabase/server";
import { createPreview, formatAnswerType, formatDateTime } from "@/lib/topics/format";
import type { TopicAnswerType } from "@/types/database";
import type { Profile } from "@/types/logic-league";

type TopicAnswerHistoryRow = {
  id: string;
  topic_id: string;
  answer_type: TopicAnswerType | null;
  content: string;
  created_at: string;
  topics: { category?: string | null; title?: string | null; type?: string | null } | { category?: string | null; title?: string | null; type?: string | null }[] | null;
};

type CountRow = { topic_answer_id: string };
type AchievementRow = { created_at: string; achievements?: { title?: string | null; description?: string | null; icon?: string | null } | { title?: string | null; description?: string | null; icon?: string | null }[] | null };
type RatingHistoryRow = { old_rating: number | null; new_rating: number | null; delta: number | null; created_at: string; topics?: { title?: string | null } | { title?: string | null }[] | null };

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

type ProfileViewProps = {
  profile: Profile;
  viewerId: string;
  saved?: string;
};

const snsLinks = [
  { key: "x_url", label: "X URL" },
  { key: "youtube_url", label: "YouTube URL" },
  { key: "github_url", label: "GitHub URL" },
] as const;

function ProfileField({ label, value, href }: { label: string; value: string | number; href?: string | null }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <dt className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-league-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-bold text-league-silver">
        {href ? <Link href={href} target="_blank" rel="noreferrer" className="text-league-gold hover:text-white">{value}</Link> : value}
      </dd>
    </div>
  );
}

export async function ProfileView({ profile, viewerId, saved }: ProfileViewProps) {
  const supabase = await createClient();
  const isOwnProfile = viewerId === profile.id;
  const profileClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? (await import("@/lib/supabase/admin")).createAdminClient() : supabase;
  const readClient = profileClient;

  const [{ count: totalAnswerCount }, { count: weeklyWins }, { count: top10Count }, { data: achievements }, { data: ratingHistories }, { data: examAnswers }, { data: topicAnswers }] = await Promise.all([
    readClient
      .from("topic_answers")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id),
    profileClient
      .from("hall_of_fame")
      .select("id", { count: "exact", head: true })
      .eq("winner_user_id", profile.id),
    profileClient
      .from("topic_answers")
      .select("id, topics!inner(type)", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("topics.type", "weekly")
      .lte("ranking_position", 10),
    profileClient
      .from("user_achievements")
      .select("created_at, achievements(title, description, icon)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
    profileClient
      .from("rating_histories")
      .select("old_rating, new_rating, delta, created_at, topics(title)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(8),
    profileClient
      .from("exam_answers")
      .select("id, answer, created_at, predicted_deviation, archetype, total_score, structure_score, hypothesis_score, originality_score, feasibility_score, risk_score, summary, strength, weakness, upper_gap")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(30),
    readClient
      .from("topic_answers")
      .select("id, topic_id, answer_type, content, created_at, topics!inner(id, type, category, title)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  const topicAnswerRows = (topicAnswers ?? []) as TopicAnswerHistoryRow[];
  const topicAnswerIds = topicAnswerRows.map((answer) => answer.id);
  const [{ data: likes }, { data: comments }] = await Promise.all([
    topicAnswerIds.length > 0 ? readClient.from("likes").select("topic_answer_id").in("topic_answer_id", topicAnswerIds) : Promise.resolve({ data: [] as CountRow[] }),
    topicAnswerIds.length > 0 ? readClient.from("comments").select("topic_answer_id").in("topic_answer_id", topicAnswerIds) : Promise.resolve({ data: [] as CountRow[] }),
  ]);
  const likeRows = (likes ?? []) as CountRow[];
  const commentRows = (comments ?? []) as CountRow[];

  const likeCounts = new Map<string, number>();
  for (const like of likeRows) likeCounts.set(like.topic_answer_id, (likeCounts.get(like.topic_answer_id) ?? 0) + 1);
  const commentCounts = new Map<string, number>();
  for (const comment of commentRows) commentCounts.set(comment.topic_answer_id, (commentCounts.get(comment.topic_answer_id) ?? 0) + 1);

  const historyItems: AnswerHistoryItem[] = [
    ...((examAnswers ?? []).map((answer) => ({ ...answer, kind: "exam" as const }))),
    ...topicAnswerRows.map((answer) => {
      const topic = Array.isArray(answer.topics) ? answer.topics[0] : answer.topics;
      return {
        kind: "topic" as const,
        id: answer.id,
        topic_id: answer.topic_id,
        created_at: answer.created_at,
        answer_type: answer.answer_type,
        content: answer.content,
        category: topic?.category ?? "Topic",
        title: topic?.title ?? "Topic",
        topicType: topic?.type ?? "daily",
        likeCount: likeCounts.get(answer.id) ?? 0,
        commentCount: commentCounts.get(answer.id) ?? 0,
      };
    }),
  ];

  const availableSnsLinks = snsLinks.flatMap((item) => {
    const href = profile[item.key];
    return href ? [{ key: item.key, label: item.label, href }] : [];
  });

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:py-12">
      <Card className="p-0">
        <div className="relative overflow-hidden p-5 sm:p-10">
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
          {saved === "profile" ? <div className="relative mb-5 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-100">プロフィールを保存しました。</div> : null}
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-[2rem] border border-amber-300/35 bg-gradient-to-br from-league-gold via-white to-slate-500 text-4xl font-black text-black shadow-[0_0_60px_rgba(215,180,106,0.2)]">
                {profile.display_name?.[0] ?? profile.username[0]}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">プロフィール</p>
                <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">{profile.display_name ?? profile.username}</h1>
                <p className="mt-2 text-league-muted">@{profile.username}</p>
                <p className="mt-4 max-w-2xl text-league-silver">{profile.bio ?? "自己紹介はまだありません。"}</p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <RankBadge rank={profile.rank} size="md" showLabel labelPlacement="bottom" />
              {isOwnProfile ? <Link href="/profile/edit" className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-bold text-league-gold transition hover:bg-amber-300/20 hover:text-white">プロフィールを編集</Link> : null}
            </div>
          </div>

          <div className="relative mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <StatCard label="Current Rank" value={profile.rank} tone="gold" />
            <StatCard label="Rating" value={profile.rating} tone="gold" />
            <StatCard label="Weekly Wins" value={weeklyWins ?? 0} tone={profile.qualified ? "emerald" : "silver"} />
            <StatCard label="Top10 Count" value={top10Count ?? 0} />
            <StatCard label="Hall of Fame" value={weeklyWins ?? 0} />
            <StatCard label="総回答数" value={totalAnswerCount ?? 0} />
          </div>
          <RankProgress rating={profile.rating} qualified={profile.qualified} className="relative mt-6" />
        </div>
      </Card>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <SectionHeader eyebrow="思考タイプ" title={profile.archetype ?? "未分類"} />
          <p className="mt-4 text-sm leading-6 text-league-silver">認定試験から推定された思考傾向です。論点の組み立て方、リスクの見方、反論への備え方を把握するための指標です。</p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-2xl font-black">{profile.rank}</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-league-muted">Rank</p></div>
            <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-2xl font-black">{profile.rating}</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-league-muted">Rating</p></div>
            <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-2xl font-black">{top10Count ?? 0}</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-league-muted">Top10</p></div>
          </div>
        </Card>

        <Card>
          <SectionHeader eyebrow="プロフィール詳細" title="基本情報・リンク" />
          <dl className="mt-6 space-y-3">
            <ProfileField label="display_name" value={profile.display_name ?? "未設定"} />
            <ProfileField label="username" value={`@${profile.username}`} />
            <ProfileField label="bio" value={profile.bio ?? "自己紹介はまだありません。"} />
            <ProfileField label="rank" value={profile.rank} />
            <ProfileField label="rating" value={profile.rating} />
            <ProfileField label="predicted_deviation" value={profile.predicted_deviation ?? "未受験"} />
            <ProfileField label="archetype" value={profile.archetype ?? "未分類"} />
            {snsLinks.map((item) => {
              const href = profile[item.key];
              return <ProfileField key={item.key} label={item.key} value={href ?? "未設定"} href={href} />;
            })}
          </dl>
          {availableSnsLinks.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {availableSnsLinks.map((link) => (
                <Link key={link.key} href={link.href} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white transition hover:border-amber-300/40 hover:text-league-gold">
                  {link.label}
                </Link>
              ))}
            </div>
          ) : <EmptyState title="SNSリンクは未設定です。">プロフィール編集からX、YouTube、GitHubのリンクを追加できます。</EmptyState>}
        </Card>
      </section>

      <section className="mt-6">
        <Card>
          <SectionHeader eyebrow="最近の活動" title="最近の投稿" />
          <div className="mt-6 space-y-4">
            {historyItems.filter((item) => item.kind === "topic").slice(0, 5).map((item) => item.kind === "topic" ? (
              <Link key={item.id} href={item.topicType === "weekly" ? `/weekly/${item.topic_id}` : `/topics/${item.topic_id}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-amber-300/35 hover:bg-white/[0.06]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-league-silver">{formatAnswerType(item.answer_type)}</span>
                  <time className="text-xs text-league-muted">{formatDateTime(item.created_at)}</time>
                </div>
                <p className="mt-3 text-sm leading-6 text-league-silver">{createPreview(item.content, 150)}</p>
              </Link>
            ) : null)}
          </div>
          {historyItems.filter((item) => item.kind === "topic").length === 0 ? <EmptyState title="まだ投稿はありません。">回答が投稿されると、ここにアクティビティが表示されます。</EmptyState> : null}
        </Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader eyebrow="Achievements" title="獲得バッジ" />
          <div className="mt-5 flex flex-wrap gap-3">
            {((achievements ?? []) as AchievementRow[]).map((row, index) => {
              const achievement = first(row.achievements);
              return (
                <span key={`${achievement?.title ?? "achievement"}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-sm font-black text-league-gold">
                  <span>{achievement?.icon ?? "◆"}</span>
                  <span>{achievement?.title ?? "Achievement"}</span>
                </span>
              );
            })}
          </div>
          {(achievements ?? []).length === 0 ? <EmptyState title="Achievementsはまだありません。">Weekly Leagueへの参加やRank到達でバッジが増えていきます。</EmptyState> : null}
        </Card>
        <Card>
          <SectionHeader eyebrow="Rating History" title="Rating変動" />
          <div className="mt-5 space-y-3">
            {((ratingHistories ?? []) as RatingHistoryRow[]).map((history, index) => {
              const topic = first(history.topics);
              return (
                <div key={`${history.created_at}-${index}`} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-bold text-white">{topic?.title ?? "Weekly League"}</p>
                    <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">+{history.delta ?? 0}</span>
                  </div>
                  <p className="mt-2 text-xs text-league-muted">{history.old_rating ?? 0} → {history.new_rating ?? 0} · {formatDateTime(history.created_at)}</p>
                </div>
              );
            })}
          </div>
          {(ratingHistories ?? []).length === 0 ? <EmptyState title="Rating変動はまだありません。">Weekly League完了後にold rating / new rating / delta / topicが保存されます。</EmptyState> : null}
        </Card>
      </section>

      <AnswerHistory items={historyItems} isOwnProfile={isOwnProfile} />
    </main>
  );
}
