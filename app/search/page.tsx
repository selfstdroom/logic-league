import Link from "next/link";
import { RankBadge } from "@/components/rank/RankBadge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { HeroPanel, PageShell, SectionHeader } from "@/components/ui/DesignSystem";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPreview, formatDateTime } from "@/lib/topics/format";

export const dynamic = "force-dynamic";

type TopicResult = { id: string; type: string; title: string; content: string; created_at: string };
type UserResult = { id: string; username: string; display_name: string | null; rank: string | null; rating: number; archetype: string | null };
type AnswerResult = { id: string; topic_id: string; content: string; created_at: string; topics?: { type?: string | null; title?: string | null } | { type?: string | null; title?: string | null }[] | null };
function first<T>(value: T | T[] | null | undefined) { return Array.isArray(value) ? value[0] : value; }

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const admin = createAdminClient();
  const pattern = `%${query}%`;
  const [topicsResponse, answersResponse, usersResponse] = query
    ? await Promise.all([
        admin.from("topics").select("id, type, title, content, created_at").eq("status", "published").or(`title.ilike.${pattern},content.ilike.${pattern}`).limit(10),
        admin.from("topic_answers").select("id, topic_id, content, created_at, topics(type, title)").ilike("content", pattern).limit(10),
        admin.from("profiles").select("id, username, display_name, rank, rating, archetype").or(`username.ilike.${pattern},display_name.ilike.${pattern},bio.ilike.${pattern}`).limit(10),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const topics = (topicsResponse.data ?? []) as TopicResult[];
  const answers = (answersResponse.data ?? []) as AnswerResult[];
  const users = (usersResponse.data ?? []) as UserResult[];

  return (
    <PageShell>
      <HeroPanel eyebrow="Search" title="Logic Leagueを検索">
        Topics、Answers、Usersをまとめて検索できます。
        <form action="/search" className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input name="q" defaultValue={query} placeholder="検索語を入力" className="min-h-12 flex-1 rounded-2xl border border-white/10 bg-black/35 px-4 text-white outline-none ring-amber-300/30 focus:ring-2" />
          <button className="rounded-2xl bg-gradient-to-r from-amber-200 to-yellow-600 px-6 py-3 font-black text-black shadow-glow">検索</button>
        </form>
      </HeroPanel>
      {!query ? <EmptyState title="検索語を入力してください。">HeaderのSearchから、知的資産を横断検索できます。</EmptyState> : null}
      {query ? (
        <div className="mt-10 space-y-10">
          <section>
            <SectionHeader eyebrow="Topics" title="Topics" />
            <div className="grid gap-4">
              {topics.map((topic) => (
                <Card key={topic.id}>
                  <Link href={topic.type === "weekly" ? `/weekly/${topic.id}` : `/topics/${topic.id}`} className="text-xl font-black text-white hover:text-league-gold">{topic.title}</Link>
                  <p className="mt-2 text-sm text-league-muted">{formatDateTime(topic.created_at)}</p>
                  <p className="mt-3 text-sm leading-7 text-league-silver">{createPreview(topic.content, 180)}</p>
                </Card>
              ))}
            </div>
            {topics.length === 0 ? <EmptyState title="Topicsは見つかりませんでした。">別の検索語を試してください。</EmptyState> : null}
          </section>
          <section>
            <SectionHeader eyebrow="Users" title="Users" />
            <div className="grid gap-4 md:grid-cols-2">
              {users.map((user) => (
                <Card key={user.id}>
                  <Link href={`/profile/${user.username}`} className="flex items-center gap-3"><RankBadge rank={user.rank} size="sm" /><span><span className="block font-black text-white">{user.display_name ?? user.username}</span><span className="block text-sm text-league-muted">@{user.username} · Rating {user.rating} · {user.archetype ?? "未分類"}</span></span></Link>
                </Card>
              ))}
            </div>
            {users.length === 0 ? <EmptyState title="Usersは見つかりませんでした。">別の検索語を試してください。</EmptyState> : null}
          </section>
          <section>
            <SectionHeader eyebrow="Answers" title="Answers" />
            <div className="grid gap-4">
              {answers.map((answer) => {
                const topic = first(answer.topics);
                return (
                  <Card key={answer.id}>
                    <Link href={topic?.type === "weekly" ? `/weekly/${answer.topic_id}` : `/topics/${answer.topic_id}`} className="font-black text-white hover:text-league-gold">{topic?.title ?? "Topic"}</Link>
                    <p className="mt-2 text-sm text-league-muted">{formatDateTime(answer.created_at)}</p>
                    <p className="mt-3 text-sm leading-7 text-league-silver">{createPreview(answer.content, 220)}</p>
                  </Card>
                );
              })}
            </div>
            {answers.length === 0 ? <EmptyState title="Answersは見つかりませんでした。">別の検索語を試してください。</EmptyState> : null}
          </section>
        </div>
      ) : null}
    </PageShell>
  );
}
