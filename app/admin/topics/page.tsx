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

type TopicFormPayload = {
  category: TopicCategory;
  title: string;
  content: string;
  publish_at: string | null;
  status: "published" | "draft";
};

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminUser(user)) redirect("/home");
}

function parseTopicForm(formData: FormData): TopicFormPayload {
  const category = formData.get("category");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const publishAt = String(formData.get("publish_at") ?? "").trim();
  const status = formData.get("status") === "draft" ? "draft" : "published";

  if (!categories.includes(category as TopicCategory)) throw new Error("カテゴリーが不正です。");
  if (!title || !content) throw new Error("タイトル and content are required.");

  return {
    category: category as TopicCategory,
    title,
    content,
    publish_at: publishAt ? new Date(publishAt).toISOString() : null,
    status,
  };
}

async function createTopic(formData: FormData) {
  "use server";
  await requireAdmin();
  const payload = parseTopicForm(formData);
  const admin = createAdminClient();
  const { error } = await admin.from("topics").insert({ ...payload, type: "daily" });
  if (error) throw error;
  revalidatePath("/admin/topics");
  revalidatePath("/topics");
  revalidatePath("/home");
}

async function updateTopic(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const payload = parseTopicForm(formData);
  const admin = createAdminClient();
  const { error } = await admin.from("topics").update(payload).eq("id", id).eq("type", "daily");
  if (error) throw error;
  revalidatePath("/admin/topics");
  revalidatePath("/topics");
  revalidatePath(`/topics/${id}`);
  revalidatePath("/home");
}

async function hideSampleTopic(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const admin = createAdminClient();
  const { error } = await admin.from("topics").update({ status: "draft" }).eq("id", id).eq("type", "daily").eq("is_sample", true);
  if (error) throw error;
  revalidatePath("/admin/topics");
  revalidatePath("/topics");
  revalidatePath(`/topics/${id}`);
  revalidatePath("/home");
}

async function deleteTopic(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const admin = createAdminClient();
  const { error } = await admin.from("topics").delete().eq("id", id).eq("type", "daily");
  if (error) throw error;
  revalidatePath("/admin/topics");
  revalidatePath("/topics");
  revalidatePath("/home");
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 16);
}

export default async function AdminTopicsPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: topics, error } = await admin
    .from("topics")
    .select("*")
    .eq("type", "daily")
    .order("publish_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <PageShell className="max-w-6xl">
      <HeroPanel eyebrow="管理" title="Daily Topic管理">
        ADMIN_EMAILに一致する管理者だけがDaily Topicを作成・編集・削除できます。
      </HeroPanel>

      <Card className="mt-8">
        <h2 className="text-2xl font-black">Topicを作成</h2>
        <form action={createTopic} className="mt-5 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-bold text-league-silver">カテゴリー<SelectCategory /></label>
            <label className="text-sm font-bold text-league-silver">公開日時<input name="publish_at" type="datetime-local" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white" /></label>
          </div>
          <label className="text-sm font-bold text-league-silver">公開状態<select name="status" defaultValue="published" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"><option value="published">公開</option><option value="draft">非公開</option></select></label>
          <label className="text-sm font-bold text-league-silver">タイトル<input name="title" required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white" /></label>
          <label className="text-sm font-bold text-league-silver">本文<textarea name="content" required rows={6} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white" /></label>
          <Button className="w-fit">Daily Topicを作成</Button>
        </form>
      </Card>

      <section className="mt-8 space-y-5">
        <h2 className="text-2xl font-black">既存のDaily Topic</h2>
        {error ? <Card className="text-red-300">トピックの取得に失敗しました: {error.message}</Card> : null}
        {(topics ?? []).map((topic) => (
          <Card key={topic.id}>
            <form action={updateTopic} className="grid gap-4">
              <input type="hidden" name="id" value={topic.id} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-league-muted">公開日時: {formatDateTime(topic.publish_at)}</p>
                <div className="flex flex-wrap gap-2"><p className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-league-silver">{topic.status}</p>{topic.is_sample ? <p className="rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1 text-xs font-black text-sky-100">公式サンプル</p> : null}</div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-bold text-league-silver">カテゴリー<SelectCategory value={topic.category as TopicCategory} /></label>
                <label className="text-sm font-bold text-league-silver">公開日時<input name="publish_at" type="datetime-local" defaultValue={toDateTimeLocal(topic.publish_at)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white" /></label>
              </div>
              <label className="text-sm font-bold text-league-silver">公開状態<select name="status" defaultValue={topic.status === "draft" ? "draft" : "published"} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"><option value="published">公開</option><option value="draft">非公開</option></select></label>
              <label className="text-sm font-bold text-league-silver">タイトル<input name="title" required defaultValue={topic.title} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white" /></label>
              <label className="text-sm font-bold text-league-silver">本文<textarea name="content" required rows={5} defaultValue={topic.content} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white" /></label>
              <div className="flex flex-wrap gap-3">
                <Button>変更を保存</Button>
              </div>
            </form>
            {topic.is_sample && topic.status !== "draft" ? <form action={hideSampleTopic} className="mt-3"><input type="hidden" name="id" value={topic.id} /><Button className="bg-none bg-sky-500/15 text-sky-100 shadow-none ring-1 ring-sky-300/30">公式サンプルを非公開にする</Button></form> : null}
            <form action={deleteTopic} className="mt-3">
              <input type="hidden" name="id" value={topic.id} />
              <Button className="bg-none bg-red-500/15 text-red-200 shadow-none ring-1 ring-red-300/30">Topicを削除</Button>
            </form>
          </Card>
        ))}
      </section>
    </PageShell>
  );
}

function SelectCategory({ value = "AI" }: { value?: TopicCategory }) {
  return (
    <select name="category" defaultValue={value} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white">
      {categories.map((category) => <option key={category} value={category}>{formatTopicCategory(category)}</option>)}
    </select>
  );
}
