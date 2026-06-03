import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { HeroPanel, PageShell } from "@/components/ui/DesignSystem";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{ error?: string; saved?: string }>;

const usernamePattern = /^[a-z0-9_-]+$/;
const editableFields = "display_name, username, bio, x_url, youtube_url, github_url";

function normalizeString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptional(value: FormDataEntryValue | null) {
  const normalized = normalizeString(value);
  return normalized.length > 0 ? normalized : null;
}

function isValidUrl(value: string | null) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function errorMessage(error?: string) {
  switch (error) {
    case "required": return "表示名とユーザー名は必須です。";
    case "username": return "ユーザー名は小文字英数字、アンダースコア、ハイフンのみ使用できます。";
    case "duplicate": return "このユーザー名はすでに使われています。";
    case "bio": return "bioは300文字以内で入力してください。";
    case "url": return "URLは http:// または https:// から始まる正しい形式で入力してください。";
    case "update": return "プロフィールを更新できませんでした。時間をおいて再度お試しください。";
    default: return null;
  }
}

export default async function ProfileEditPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select(`id, ${editableFields}`).eq("id", user.id).maybeSingle();
  if (!profile) redirect("/home");

  const params = await searchParams;
  const message = errorMessage(params.error);

  async function updateProfile(formData: FormData) {
    "use server";

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const displayName = normalizeString(formData.get("display_name"));
    const username = normalizeString(formData.get("username")).toLowerCase();
    const bio = normalizeOptional(formData.get("bio"));
    const xUrl = normalizeOptional(formData.get("x_url"));
    const youtubeUrl = normalizeOptional(formData.get("youtube_url"));
    const githubUrl = normalizeOptional(formData.get("github_url"));

    if (!displayName || !username) redirect("/profile/edit?error=required");
    if (!usernamePattern.test(username)) redirect("/profile/edit?error=username");
    if (bio && bio.length > 300) redirect("/profile/edit?error=bio");
    if (![xUrl, youtubeUrl, githubUrl].every(isValidUrl)) redirect("/profile/edit?error=url");

    const { data: existing } = await supabase.from("profiles").select("id").eq("username", username).neq("id", user.id).maybeSingle();
    if (existing) redirect("/profile/edit?error=duplicate");

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        username,
        bio,
        x_url: xUrl,
        youtube_url: youtubeUrl,
        github_url: githubUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) redirect("/profile/edit?error=update");

    revalidatePath("/profile");
    revalidatePath(`/profile/${username}`);
    revalidatePath("/home");
    redirect(`/profile/${username}?saved=profile`);
  }

  return (
    <PageShell className="max-w-3xl">
      <HeroPanel eyebrow="Profile Edit" title="プロフィールを編集">
        Rank、Rating、推定思考偏差値、思考アーキタイプは認定試験とリーグ結果から管理されます。
      </HeroPanel>

      <Card className="mt-6 p-4 sm:p-6">
        {message ? <div className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">{message}</div> : null}
        {params.saved ? <div className="mb-5 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-100">保存しました。</div> : null}
        <form action={updateProfile} className="space-y-5">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-league-muted">表示名</span>
            <input name="display_name" required defaultValue={profile.display_name ?? ""} className="premium-input mt-2" />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-league-muted">ユーザー名</span>
            <input name="username" required pattern="[a-z0-9_-]+" defaultValue={profile.username} className="premium-input mt-2" />
            <span className="mt-2 block text-xs text-league-muted">小文字英数字、_、- のみ使用できます。</span>
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-league-muted">bio</span>
            <textarea name="bio" maxLength={300} defaultValue={profile.bio ?? ""} rows={5} className="premium-input mt-2" />
            <span className="mt-2 block text-xs text-league-muted">300文字以内</span>
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.22em] text-league-muted">X URL</span>
              <input name="x_url" type="url" defaultValue={profile.x_url ?? ""} placeholder="https://x.com/..." className="premium-input mt-2" />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.22em] text-league-muted">YouTube URL</span>
              <input name="youtube_url" type="url" defaultValue={profile.youtube_url ?? ""} placeholder="https://youtube.com/..." className="premium-input mt-2" />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.22em] text-league-muted">GitHub URL</span>
              <input name="github_url" type="url" defaultValue={profile.github_url ?? ""} placeholder="https://github.com/..." className="premium-input mt-2" />
            </label>
          </div>
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Link href={`/profile/${profile.username}`} className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-6 py-3 text-sm font-bold text-white transition hover:bg-white/[0.1]">キャンセル</Link>
            <Button type="submit">変更を保存</Button>
          </div>
        </form>
      </Card>
    </PageShell>
  );
}
