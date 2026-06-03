import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/topics/auth";
import { formatDateTime } from "@/lib/topics/format";
import type { TopicCategory } from "@/types/database";

const categories: TopicCategory[] = ["AI", "Business", "Economics", "Society", "Psychology", "Science"];

type TopicFormPayload = {
  category: TopicCategory;
  title: string;
  content: string;
  publish_at: string | null;
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

  if (!categories.includes(category as TopicCategory)) throw new Error("Invalid category.");
  if (!title || !content) throw new Error("Title and content are required.");

  return {
    category: category as TopicCategory,
    title,
    content,
    publish_at: publishAt ? new Date(publishAt).toISOString() : null,
  };
}

async function createTopic(formData: FormData) {
  "use server";
  await requireAdmin();
  const payload = parseTopicForm(formData);
  const admin = createAdminClient();
  const { error } = await admin.from("topics").insert({ ...payload, type: "daily", status: "published" });
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
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-league-gold">Admin</p>
        <h1 className="mt-3 text-4xl font-black">Daily Topic Management</h1>
        <p className="mt-4 text-league-silver">ADMIN_EMAILに一致する管理者だけがDaily Topicを作成・編集・削除できます。</p>
      </div>

      <Card>
        <h2 className="text-2xl font-black">Create topic</h2>
        <form action={createTopic} className="mt-5 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-bold text-league-silver">Category<SelectCategory /></label>
            <label className="text-sm font-bold text-league-silver">Publish at<input name="publish_at" type="datetime-local" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white" /></label>
          </div>
          <label className="text-sm font-bold text-league-silver">Title<input name="title" required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white" /></label>
          <label className="text-sm font-bold text-league-silver">Content<textarea name="content" required rows={6} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white" /></label>
          <Button className="w-fit">Create Daily Topic</Button>
        </form>
      </Card>

      <section className="mt-8 space-y-5">
        <h2 className="text-2xl font-black">Existing daily topics</h2>
        {error ? <Card className="text-red-300">トピックの取得に失敗しました: {error.message}</Card> : null}
        {(topics ?? []).map((topic) => (
          <Card key={topic.id}>
            <form action={updateTopic} className="grid gap-4">
              <input type="hidden" name="id" value={topic.id} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-league-muted">Published: {formatDateTime(topic.publish_at)}</p>
                <p className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-league-silver">{topic.status}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-bold text-league-silver">Category<SelectCategory value={topic.category as TopicCategory} /></label>
                <label className="text-sm font-bold text-league-silver">Publish at<input name="publish_at" type="datetime-local" defaultValue={toDateTimeLocal(topic.publish_at)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white" /></label>
              </div>
              <label className="text-sm font-bold text-league-silver">Title<input name="title" required defaultValue={topic.title} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white" /></label>
              <label className="text-sm font-bold text-league-silver">Content<textarea name="content" required rows={5} defaultValue={topic.content} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white" /></label>
              <div className="flex flex-wrap gap-3">
                <Button>Save changes</Button>
              </div>
            </form>
            <form action={deleteTopic} className="mt-3">
              <input type="hidden" name="id" value={topic.id} />
              <Button className="bg-none bg-red-500/15 text-red-200 shadow-none ring-1 ring-red-300/30">Delete topic</Button>
            </form>
          </Card>
        ))}
      </section>
    </main>
  );
}

function SelectCategory({ value = "AI" }: { value?: TopicCategory }) {
  return (
    <select name="category" defaultValue={value} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white">
      {categories.map((category) => <option key={category} value={category}>{category}</option>)}
    </select>
  );
}
