import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { HeroPanel, PageShell } from "@/components/ui/DesignSystem";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/topics/auth";
import { formatDateTime, formatTopicCategory } from "@/lib/topics/format";
import type { TopicCategory } from "@/types/database";

const categories: TopicCategory[] = ["AI", "Business", "Economics", "Society", "Psychology", "Science"];

type WeeklyTopicFormPayload = {
  category: TopicCategory;
  title: string;
  content: string;
  publish_at: string | null;
  deadline_at: string | null;
  reveal_at: string | null;
  vote_deadline_at: string | null;
};

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminUser(user)) redirect("/home");
}

function parseDateTime(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? new Date(text).toISOString() : null;
}

function parseWeeklyTopicForm(formData: FormData): WeeklyTopicFormPayload {
  const category = formData.get("category");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!categories.includes(category as TopicCategory)) throw new Error("カテゴリーが不正です。");
  if (!title || !content) throw new Error("タイトル and content are required.");

  return {
    category: category as TopicCategory,
    title,
    content,
    publish_at: parseDateTime(formData.get("publish_at")),
    deadline_at: parseDateTime(formData.get("deadline_at")),
    reveal_at: parseDateTime(formData.get("reveal_at")),
    vote_deadline_at: parseDateTime(formData.get("vote_deadline_at")),
  };
}

async function createWeeklyTopic(formData: FormData) {
  "use server";
  await requireAdmin();
  const payload = parseWeeklyTopicForm(formData);
  const admin = createAdminClient();
  const { error } = await admin.from("topics").insert({ ...payload, type: "weekly", status: "published" });
  if (error) throw error;
  revalidatePath("/admin/weekly");
  revalidatePath("/weekly");
  revalidatePath("/home");
}

async function updateWeeklyTopic(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const payload = parseWeeklyTopicForm(formData);
  const admin = createAdminClient();
  const { error } = await admin.from("topics").update(payload).eq("id", id).eq("type", "weekly");
  if (error) throw error;
  revalidatePath("/admin/weekly");
  revalidatePath("/weekly");
  revalidatePath(`/weekly/${id}`);
  revalidatePath("/home");
}

async function deleteWeeklyTopic(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const admin = createAdminClient();
  const { error } = await admin.from("topics").delete().eq("id", id).eq("type", "weekly");
  if (error) throw error;
  revalidatePath("/admin/weekly");
  revalidatePath("/weekly");
  revalidatePath("/home");
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 16);
}

function DateField({ name, label, value }: { name: string; label: string; value?: string | null }) {
  return (
    <label className="text-sm font-bold text-league-silver">
      {label}
      <input name={name} type="datetime-local" defaultValue={toDateTimeLocal(value ?? null)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white" />
    </label>
  );
}

function SelectCategory({ value = "Society" }: { value?: TopicCategory }) {
  return (
    <select name="category" defaultValue={value} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white">
      {categories.map((category) => <option key={category} value={category}>{formatTopicCategory(category)}</option>)}
    </select>
  );
}

export default async function AdminWeeklyPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: topics, error } = await admin
    .from("topics")
    .select("*")
    .eq("type", "weekly")
    .order("publish_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <PageShell className="max-w-6xl">
      <HeroPanel eyebrow="管理" title="Weekly League管理">
        Weekly League用のTopicを作成・編集・削除できます。Topic種別は常にweeklyです。
      </HeroPanel>

      <Card className="mt-8">
        <h2 className="text-2xl font-black">Weekly League Topicを作成</h2>
        <form action={createWeeklyTopic} className="mt-5 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-bold text-league-silver">カテゴリー<SelectCategory /></label><DateField name="publish_at" label="公開日時" /></div>
          <div className="grid gap-4 md:grid-cols-3"><DateField name="deadline_at" label="投稿締切" /><DateField name="reveal_at" label="公開日時" /><DateField name="vote_deadline_at" label="投票締切" /></div>
          <label className="text-sm font-bold text-league-silver">タイトル<input name="title" required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white" /></label>
          <label className="text-sm font-bold text-league-silver">本文<textarea name="content" required rows={6} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white" /></label>
          <Button className="w-fit">Weekly League Topicを作成</Button>
        </form>
      </Card>

      <section className="mt-8 space-y-5">
        <h2 className="text-2xl font-black">既存のWeekly League Topic</h2>
        {error ? <Card className="text-red-300">Weekly LeagueのTopic取得に失敗しました: {error.message}</Card> : null}
        {(topics ?? []).map((topic) => (
          <Card key={topic.id}>
            <form action={updateWeeklyTopic} className="grid gap-4">
              <input type="hidden" name="id" value={topic.id} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-league-muted">公開日時: {formatDateTime(topic.publish_at)} · 締切: {formatDateTime(topic.deadline_at)}</p>
                <p className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-league-silver">{topic.status}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-bold text-league-silver">カテゴリー<SelectCategory value={topic.category as TopicCategory} /></label><DateField name="publish_at" label="公開日時" value={topic.publish_at} /></div>
              <div className="grid gap-4 md:grid-cols-3"><DateField name="deadline_at" label="投稿締切" value={topic.deadline_at} /><DateField name="reveal_at" label="公開日時" value={topic.reveal_at} /><DateField name="vote_deadline_at" label="投票締切" value={topic.vote_deadline_at} /></div>
              <label className="text-sm font-bold text-league-silver">タイトル<input name="title" required defaultValue={topic.title} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white" /></label>
              <label className="text-sm font-bold text-league-silver">本文<textarea name="content" required rows={5} defaultValue={topic.content} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white" /></label>
              <Button className="w-fit">変更を保存</Button>
            </form>
            <form action={deleteWeeklyTopic} className="mt-3"><input type="hidden" name="id" value={topic.id} /><Button className="bg-none bg-red-500/15 text-red-200 shadow-none ring-1 ring-red-300/30">Topicを削除</Button></form>
          </Card>
        ))}
      </section>
    </PageShell>
  );
}
