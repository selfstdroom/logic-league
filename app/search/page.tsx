import Link from "next/link";
import { RankBadge } from "@/components/rank/RankBadge";
import { PremiumAvatar } from "@/components/ui/PremiumAvatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { HeroPanel, PageShell, PremiumBadge, SectionHeader } from "@/components/ui/DesignSystem";
import { OnboardingHint } from "@/components/ui/OnboardingHint";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPreview, formatDateTime, formatDiscussionType, formatTopicCategory } from "@/lib/topics/format";

export const dynamic = "force-dynamic";

type TopicResult = { id: string; type: string; category: string; title: string; content: string; created_at: string; is_sample?: boolean | null };
type UserResult = { id: string; username: string; display_name: string | null; avatar_url: string | null; rank: string | null; rating: number; archetype: string | null; created_at: string };
type AnswerResult = {
  id: string;
  topic_id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_sample?: boolean | null;
  topics?: { type?: string | null; title?: string | null; category?: string | null; is_sample?: boolean | null } | { type?: string | null; title?: string | null; category?: string | null; is_sample?: boolean | null }[] | null;
  profiles?: { username?: string | null; display_name?: string | null; rank?: string | null } | { username?: string | null; display_name?: string | null; rank?: string | null }[] | null;
};
type CountRow = { topic_id?: string | null; topic_answer_id?: string | null };

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeSearchPattern(query: string) {
  return `%${query.replace(/[,%()]/g, " ").trim()}%`;
}

function topicHref(topic: Pick<TopicResult, "id" | "type"> | { id?: string; type?: string | null }) {
  return topic.type === "weekly" ? `/weekly/${topic.id}` : `/topics/${topic.id}`;
}

function Avatar({ user }: { user: UserResult }) {
  return <PremiumAvatar avatarUrl={user.avatar_url} displayName={user.display_name} username={user.username} rank={user.rank} size="medium" />;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const admin = createAdminClient();
  const pattern = safeSearchPattern(query);
  const [topicsResponse, answersResponse, usersResponse] = query
    ? await Promise.all([
        admin
          .from("topics")
          .select("id, type, category, title, content, created_at, is_sample")
          .eq("status", "published")
          .or(`title.ilike.${pattern},content.ilike.${pattern},category.ilike.${pattern}`)
          .order("created_at", { ascending: false })
          .limit(12),
        admin
          .from("topic_answers")
          .select("id, topic_id, user_id, content, created_at, is_sample, topics(type, title, category, is_sample), profiles(username, display_name, rank)")
          .ilike("content", pattern)
          .order("created_at", { ascending: false })
          .limit(12),
        admin
          .from("profiles")
          .select("id, username, display_name, avatar_url, rank, rating, archetype, created_at")
          .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
          .order("rating", { ascending: false })
          .limit(12),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const topics = (topicsResponse.data ?? []) as TopicResult[];
  const answers = (answersResponse.data ?? []) as AnswerResult[];
  const users = (usersResponse.data ?? []) as UserResult[];
  const topicIds = topics.map((topic) => topic.id);
  const topicAnswerIds = answers.map((answer) => answer.id);
  const [{ data: answerCountRows }, { data: commentCountRows }, { data: answerCommentRows }] = await Promise.all([
    topicIds.length > 0 ? admin.from("topic_answers").select("topic_id").in("topic_id", topicIds) : Promise.resolve({ data: [] as CountRow[] }),
    topicIds.length > 0 ? admin.from("comments").select("topic_answer_id, topic_answers!inner(topic_id)").in("topic_answers.topic_id", topicIds) : Promise.resolve({ data: [] as CountRow[] }),
    topicAnswerIds.length > 0 ? admin.from("comments").select("topic_answer_id").in("topic_answer_id", topicAnswerIds) : Promise.resolve({ data: [] as CountRow[] }),
  ]);

  const answerCounts = new Map<string, number>();
  for (const row of (answerCountRows ?? []) as CountRow[]) {
    if (row.topic_id) answerCounts.set(row.topic_id, (answerCounts.get(row.topic_id) ?? 0) + 1);
  }
  const commentCounts = new Map<string, number>();
  for (const row of (commentCountRows ?? []) as (CountRow & { topic_answers?: { topic_id?: string | null } | { topic_id?: string | null }[] | null })[]) {
    const topic = first(row.topic_answers);
    if (topic?.topic_id) commentCounts.set(topic.topic_id, (commentCounts.get(topic.topic_id) ?? 0) + 1);
  }
  const answerCommentCounts = new Map<string, number>();
  for (const row of (answerCommentRows ?? []) as CountRow[]) {
    if (row.topic_answer_id) answerCommentCounts.set(row.topic_answer_id, (answerCommentCounts.get(row.topic_answer_id) ?? 0) + 1);
  }
  const totalResults = topics.length + users.length + answers.length;

  return (
    <PageShell>
      <OnboardingHint storageKey="logic-league:onboarding:search" title="検索の使い方" className="mb-5">
        議論・回答・ユーザーを検索できます。キーワードを短くすると、関連する思考資産を見つけやすくなります。
      </OnboardingHint>
      <HeroPanel eyebrow="検索" title="Logic Leagueを検索">
        議論、回答、ユーザーを横断して探せます。タイトル・本文・カテゴリ・ユーザー名から、次に読むべき議論へ移動できます。
        <form action="/search" className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input name="q" defaultValue={query} placeholder="キーワードを入力" className="min-h-12 flex-1 rounded-2xl border border-white/10 bg-black/35 px-4 text-white outline-none ring-amber-300/30 placeholder:text-league-muted focus:ring-2" />
          <button className="rounded-2xl bg-gradient-to-r from-amber-200 to-yellow-600 px-6 py-3 font-black text-black shadow-glow">検索</button>
        </form>
      </HeroPanel>

      {!query ? <EmptyState kind="search" title="検索語を入力してください。">ヘッダーの検索バーから、知的資産をすばやく横断検索できます。</EmptyState> : null}
      {query && totalResults === 0 ? <EmptyState kind="search" title="検索結果が見つかりませんでした">別のキーワードや短い語句で試してください。</EmptyState> : null}

      {query ? (
        <div className="mt-10 space-y-10">
          <section>
            <SectionHeader eyebrow="議論" title="議論" action={<PremiumBadge>{topics.length}件</PremiumBadge>} />
            <div className="grid gap-4">
              {topics.map((topic) => (
                <Card key={topic.id}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2"><PremiumBadge tone="gold">{formatDiscussionType(topic.type)}</PremiumBadge>{topic.is_sample ? <PremiumBadge>公式サンプル</PremiumBadge> : null}</div>
                      <h2 className="mt-3 text-xl font-black text-white">{topic.title}</h2>
                      <p className="mt-2 text-sm text-league-muted">作成日: {formatDateTime(topic.created_at)}</p>
                    </div>
                    <Link href={topicHref(topic)} className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-black text-league-gold transition hover:bg-amber-300/20 hover:text-white">議論を見る</Link>
                  </div>
                  {topic.is_sample ? <p className="mt-4 rounded-2xl border border-sky-300/20 bg-sky-300/10 p-3 text-sm font-bold text-sky-100">これはLogic League運営によるサンプル議論です</p> : null}
                  <p className="mt-4 text-sm leading-7 text-league-silver">{createPreview(topic.content, 180)}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-league-muted">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">回答 {answerCounts.get(topic.id) ?? 0}</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">コメント {commentCounts.get(topic.id) ?? 0}</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader eyebrow="Users" title="ユーザー" action={<PremiumBadge>{users.length}件</PremiumBadge>} />
            <div className="grid gap-4 md:grid-cols-2">
              {users.map((user) => (
                <Card key={user.id}>
                  <div className="flex items-start gap-4">
                    <Avatar user={user} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><RankBadge rank={user.rank} size="medium" /><span className="font-black text-white">{user.display_name ?? user.username}</span></div>
                      <p className="mt-1 truncate text-sm text-league-muted">@{user.username}</p>
                      <p className="mt-2 text-sm text-league-silver">Rank {user.rank ?? "Visitor"} · Rating {user.rating ?? 0} · {user.archetype ?? "未分類"}</p>
                      <p className="mt-1 text-xs text-league-muted">作成日: {formatDateTime(user.created_at)}</p>
                    </div>
                  </div>
                  <Link href={`/profile/${user.username}`} className="mt-4 inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-black text-league-gold transition hover:bg-amber-300/20 hover:text-white">プロフィールを見る</Link>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader eyebrow="Answers" title="回答" action={<PremiumBadge>{answers.length}件</PremiumBadge>} />
            <div className="grid gap-4">
              {answers.map((answer) => {
                const topic = first(answer.topics);
                const profile = first(answer.profiles);
                return (
                  <Card key={answer.id}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <Link href={topicHref({ id: answer.topic_id, type: topic?.type })} className="text-lg font-black text-white transition hover:text-league-gold">{topic?.title ?? "議論"}</Link>
                        <p className="mt-2 text-sm text-league-muted">{formatTopicCategory(topic?.category)} · 作成日: {formatDateTime(answer.created_at)} · コメント {answerCommentCounts.get(answer.id) ?? 0}</p>
                      </div>
                      <Link href={topicHref({ id: answer.topic_id, type: topic?.type })} className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-black text-league-gold transition hover:bg-amber-300/20 hover:text-white">回答を見る</Link>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-league-silver"><RankBadge rank={profile?.rank} size="medium" />{answer.is_sample || topic?.is_sample ? <span className="rounded-full border border-sky-300/30 bg-sky-300/10 px-2.5 py-1 text-xs font-black text-sky-100">公式サンプル回答</span> : null}<span>{answer.is_sample ? "Logic League運営" : profile?.display_name ?? profile?.username ?? "ユーザー"}</span>{profile?.username ? <span className="text-league-muted">@{profile.username}</span> : null}</div>
                    <p className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-league-silver">{createPreview(answer.content, 240)}</p>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </PageShell>
  );
}
