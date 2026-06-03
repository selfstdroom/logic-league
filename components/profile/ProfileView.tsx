import Link from "next/link";
import { AnswerHistory, type AnswerHistoryItem } from "@/components/profile/AnswerHistory";
import { RankBadge } from "@/components/rank/RankBadge";
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
  topics: { category?: string | null; title?: string | null } | { category?: string | null; title?: string | null }[] | null;
};

type CountRow = { topic_answer_id: string };

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

  const [{ count: dailyAnswerCount }, { data: recentAnswers }, { data: examAnswers }, { data: topicAnswers }] = await Promise.all([
    supabase
      .from("topic_answers")
      .select("id, topics!inner(type)", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("topics.type", "daily"),
    supabase
      .from("topic_answers")
      .select("id, topic_id, answer_type, content, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5),
    profileClient
      .from("exam_answers")
      .select("id, answer, created_at, predicted_deviation, archetype, total_score, structure_score, hypothesis_score, originality_score, feasibility_score, risk_score, summary, strength, weakness, upper_gap")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("topic_answers")
      .select("id, topic_id, answer_type, content, created_at, topics!inner(id, type, category, title)")
      .eq("user_id", profile.id)
      .eq("topics.type", "daily")
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  const topicAnswerRows = (topicAnswers ?? []) as TopicAnswerHistoryRow[];
  const topicAnswerIds = topicAnswerRows.map((answer) => answer.id);
  const [{ data: likes }, { data: comments }] = await Promise.all([
    topicAnswerIds.length > 0 ? supabase.from("likes").select("topic_answer_id").in("topic_answer_id", topicAnswerIds) : Promise.resolve({ data: [] as CountRow[] }),
    topicAnswerIds.length > 0 ? supabase.from("comments").select("topic_answer_id").in("topic_answer_id", topicAnswerIds) : Promise.resolve({ data: [] as CountRow[] }),
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
        title: topic?.title ?? "Daily Topic",
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

          <div className="relative mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Rating" value={profile.rating} tone="gold" />
            <StatCard label="推定思考偏差値" value={profile.predicted_deviation ?? "未受験"} />
            <StatCard label="Daily Topic回答履歴" value={dailyAnswerCount ?? 0} />
            <StatCard label="認定試験回答履歴" value={(examAnswers ?? []).length} tone={profile.qualified ? "emerald" : "silver"} />
          </div>
        </div>
      </Card>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <SectionHeader eyebrow="思考タイプ" title={profile.archetype ?? "未分類"} />
          <p className="mt-4 text-sm leading-6 text-league-silver">認定試験から推定された思考傾向です。論点の組み立て方、リスクの見方、反論への備え方を把握するための指標です。</p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-2xl font-black">{profile.rank}</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-league-muted">Rank</p></div>
            <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-2xl font-black">{profile.rating}</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-league-muted">Rating</p></div>
            <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-2xl font-black">{profile.qualified ? "済" : "未"}</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-league-muted">認定</p></div>
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
            {(recentAnswers ?? []).map((answer) => (
              <Link key={answer.id} href={`/topics/${answer.topic_id}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-amber-300/35 hover:bg-white/[0.06]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-league-silver">{formatAnswerType(answer.answer_type)}</span>
                  <time className="text-xs text-league-muted">{formatDateTime(answer.created_at)}</time>
                </div>
                <p className="mt-3 text-sm leading-6 text-league-silver">{createPreview(answer.content, 150)}</p>
              </Link>
            ))}
          </div>
          {(recentAnswers ?? []).length === 0 ? <EmptyState title="まだ投稿はありません。">回答が投稿されると、ここにアクティビティが表示されます。</EmptyState> : null}
        </Card>
      </section>

      <AnswerHistory items={historyItems} isOwnProfile={isOwnProfile} />
    </main>
  );
}
