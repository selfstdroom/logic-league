import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { HeroPanel, PageShell, PremiumBadge, SectionHeader } from "@/components/ui/DesignSystem";
import { LeagueIcon, type LeagueIconName } from "@/components/ui/LeagueIcon";
import { getOrCreateOwnProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";
import type { UserSettings } from "@/types/logic-league";

const usernamePattern = /^[a-z0-9_-]+$/;
const validThemes = new Set(["dark", "light", "system"]);
const validDensities = new Set(["standard", "compact"]);

type SearchParams = Promise<{ error?: string; saved?: string }>;
type SettingsSection = {
  id: string;
  title: string;
  description: string;
  icon: LeagueIconName;
};

type ToggleDefinition = {
  name: keyof UserSettings;
  label: string;
  description: string;
};

const settingsSections: SettingsSection[] = [
  { id: "account", title: "アカウント", description: "ログイン情報と基本アカウント名を管理します。", icon: "profile" },
  { id: "profile", title: "プロフィール", description: "自己紹介とSNSリンクを管理します。", icon: "settings" },
  { id: "privacy", title: "プライバシー", description: "公開プロフィールで見せる範囲を選びます。", icon: "search" },
  { id: "notifications", title: "通知", description: "受け取りたいリーグ通知を保存します。", icon: "notifications" },
  { id: "display", title: "表示", description: "テーマと表示密度の好みを保存します。", icon: "home" },
  { id: "navigation", title: "ナビゲーション", description: "現在の下部ナビと候補を確認します。", icon: "timeline" },
  { id: "management", title: "アカウント管理", description: "ログアウトと削除前の安全確認を行います。", icon: "settings" },
];

const privacyToggles: ToggleDefinition[] = [
  { name: "privacy_profile_public", label: "プロフィールを公開する", description: "OFFにすると将来の公開制御でプロフィール全体を非公開にします。" },
  { name: "privacy_thought_log_public", label: "思考ログを公開する", description: "Daily TopicsやWeekly Leagueの公開可能な投稿履歴を表示します。" },
  { name: "privacy_exam_results_public", label: "認定試験結果を公開する", description: "推定思考偏差値や認定試験由来の情報を表示対象にします。" },
  { name: "privacy_stats_public", label: "戦績を公開する", description: "Rank、Rating、Weekly Wins、Top10などの戦績情報を表示対象にします。" },
  { name: "privacy_achievements_public", label: "実績を公開する", description: "獲得済み実績と進捗を表示対象にします。" },
];

const notificationToggles: ToggleDefinition[] = [
  { name: "notify_comments", label: "コメント通知", description: "自分の投稿へのコメント更新を受け取ります。" },
  { name: "notify_likes", label: "いいね通知", description: "自分の投稿へのいいねを受け取ります。" },
  { name: "notify_weekly_results", label: "Weekly League結果通知", description: "Weekly Leagueの結果公開を受け取ります。" },
  { name: "notify_rank_up", label: "Rank昇格通知", description: "Rankが上がったときに通知します。" },
  { name: "notify_achievement_unlocked", label: "実績獲得通知", description: "新しい実績を獲得したときに通知します。" },
  { name: "notify_hall_of_fame", label: "Hall of Fame通知", description: "Hall of Fameに関連する更新を受け取ります。" },
];

const currentNavigation = ["ホーム", "タイムライン", "検索", "マイページ"];
const availableNavigation = ["ホーム", "タイムライン", "検索", "マイページ", "議論", "Leaderboard", "Hall of Fame", "実績", "通知", "設定"];

const defaultSettings: Omit<UserSettings, "user_id" | "created_at" | "updated_at"> = {
  privacy_profile_public: true,
  privacy_thought_log_public: true,
  privacy_exam_results_public: true,
  privacy_stats_public: true,
  privacy_achievements_public: true,
  notify_comments: true,
  notify_likes: true,
  notify_weekly_results: true,
  notify_rank_up: true,
  notify_achievement_unlocked: true,
  notify_hall_of_fame: true,
  theme: "dark",
  display_density: "standard",
};

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

function getChecked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function settingErrorMessage(error?: string) {
  switch (error) {
    case "required": return "表示名とユーザー名は必須です。";
    case "username": return "ユーザー名は小文字英数字、アンダースコア、ハイフンのみ使用できます。";
    case "duplicate": return "このユーザー名はすでに使われています。";
    case "bio": return "自己紹介は300文字以内で入力してください。";
    case "url": return "SNS URLは http:// または https:// から始まる正しい形式で入力してください。";
    case "display": return "表示設定の値が正しくありません。";
    case "save": return "設定を保存できませんでした。時間をおいて再度お試しください。";
    default: return null;
  }
}

async function getOwnSettings(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle();
  if (data) return { ...defaultSettings, ...data } as UserSettings;

  const now = new Date().toISOString();
  const { data: created } = await supabase
    .from("user_settings")
    .insert({ user_id: userId, ...defaultSettings })
    .select("*")
    .maybeSingle();

  return (created ?? { user_id: userId, created_at: now, updated_at: now, ...defaultSettings }) as UserSettings;
}

async function saveSettings(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = normalizeString(formData.get("display_name"));
  const username = normalizeString(formData.get("username")).toLowerCase();
  const bio = normalizeOptional(formData.get("bio"));
  const xUrl = normalizeOptional(formData.get("x_url"));
  const githubUrl = normalizeOptional(formData.get("github_url"));
  const youtubeUrl = normalizeOptional(formData.get("youtube_url"));
  const theme = normalizeString(formData.get("theme"));
  const displayDensity = normalizeString(formData.get("display_density"));

  if (!displayName || !username) redirect("/settings?error=required");
  if (!usernamePattern.test(username)) redirect("/settings?error=username");
  if (bio && bio.length > 300) redirect("/settings?error=bio");
  if (![xUrl, githubUrl, youtubeUrl].every(isValidUrl)) redirect("/settings?error=url");
  if (!validThemes.has(theme) || !validDensities.has(displayDensity)) redirect("/settings?error=display");

  const { data: existing } = await supabase.from("profiles").select("id").eq("username", username).neq("id", user.id).maybeSingle();
  if (existing) redirect("/settings?error=duplicate");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      username,
      bio,
      x_url: xUrl,
      github_url: githubUrl,
      youtube_url: youtubeUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) redirect("/settings?error=save");

  const { error: settingsError } = await supabase.from("user_settings").upsert({
    user_id: user.id,
    privacy_profile_public: getChecked(formData, "privacy_profile_public"),
    privacy_thought_log_public: getChecked(formData, "privacy_thought_log_public"),
    privacy_exam_results_public: getChecked(formData, "privacy_exam_results_public"),
    privacy_stats_public: getChecked(formData, "privacy_stats_public"),
    privacy_achievements_public: getChecked(formData, "privacy_achievements_public"),
    notify_comments: getChecked(formData, "notify_comments"),
    notify_likes: getChecked(formData, "notify_likes"),
    notify_weekly_results: getChecked(formData, "notify_weekly_results"),
    notify_rank_up: getChecked(formData, "notify_rank_up"),
    notify_achievement_unlocked: getChecked(formData, "notify_achievement_unlocked"),
    notify_hall_of_fame: getChecked(formData, "notify_hall_of_fame"),
    theme: theme as UserSettings["theme"],
    display_density: displayDensity as UserSettings["display_density"],
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (settingsError) redirect("/settings?error=save");

  revalidatePath("/settings");
  revalidatePath("/profile");
  revalidatePath(`/profile/${username}`);
  revalidatePath("/home");
  redirect("/settings?saved=1");
}

async function logout() {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/login?message=${encodeURIComponent("ログアウトしました。")}`);
}

function ToggleRow({ item, checked }: { item: ToggleDefinition; checked: boolean }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-amber-300/25 hover:bg-white/[0.05]">
      <span>
        <span className="block text-sm font-black text-white">{item.label}</span>
        <span className="mt-1 block text-xs leading-5 text-league-muted">{item.description}</span>
      </span>
      <input type="checkbox" name={item.name} defaultChecked={checked} className="mt-1 h-6 w-11 shrink-0 cursor-pointer rounded-full border-white/20 bg-white/10 text-league-gold focus:ring-league-gold" />
    </label>
  );
}

function SelectCard({ name, label, description, value, options }: { name: string; label: string; description: string; value: string; options: { value: string; label: string }[] }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-black/20 p-4">
      <span className="text-sm font-black text-white">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-league-muted">{description}</span>
      <select name={name} defaultValue={value} className="premium-input mt-3">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

export default async function SettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, settings, params] = await Promise.all([
    getOrCreateOwnProfile(supabase, user),
    getOwnSettings(user.id),
    searchParams,
  ]);
  const errorMessage = settingErrorMessage(params.error);

  return (
    <PageShell className="max-w-6xl pb-28 md:pb-10">
      <HeroPanel
        eyebrow="設定"
        title="アカウントとリーグ体験の管理"
        actions={(
          <>
            <Link href="/profile" className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:border-amber-300/30 hover:bg-white/[0.1]">マイページへ戻る</Link>
            <Link href={`/profile/${profile.username}`} className="rounded-full border border-amber-300/30 bg-amber-300/10 px-5 py-3 text-sm font-black text-league-gold transition hover:bg-amber-300/20 hover:text-white">公開プロフィールを確認</Link>
          </>
        )}
      >
        プロフィール、プライバシー、通知、表示、ナビゲーションを一か所で管理します。Logic LeagueのSNSらしい体験を、モバイルでも迷わず調整できます。
      </HeroPanel>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {settingsSections.map((section) => (
          <a key={section.id} href={`#${section.id}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 transition hover:border-amber-300/35 hover:bg-white/[0.06]">
            <LeagueIcon name={section.icon} size={20} className="text-league-gold" />
            <span className="mt-3 block text-sm font-black text-white">{section.title}</span>
            <span className="mt-1 block text-[0.68rem] leading-5 text-league-muted">{section.description}</span>
          </a>
        ))}
      </section>

      {errorMessage ? <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">{errorMessage}</div> : null}
      {params.saved ? <div className="mt-6 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-100">設定を保存しました。</div> : null}

      <form action={saveSettings} className="mt-8 space-y-8">
        <Card id="account">
          <SectionHeader eyebrow="Account" title="アカウント">
            メールアドレスはログイン情報として表示のみです。ユーザー名と表示名は公開プロフィールにも反映されます。
          </SectionHeader>
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.22em] text-league-muted">メールアドレス</span>
              <input value={profile.email ?? user.email ?? "未設定"} readOnly className="premium-input mt-2 opacity-70" />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.22em] text-league-muted">ユーザー名</span>
              <input name="username" required pattern="[a-z0-9_-]+" defaultValue={profile.username} className="premium-input mt-2" />
              <span className="mt-2 block text-xs text-league-muted">小文字英数字、_、- のみ使用できます。</span>
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.22em] text-league-muted">表示名</span>
              <input name="display_name" required defaultValue={profile.display_name ?? ""} className="premium-input mt-2" />
            </label>
          </div>
        </Card>

        <Card id="profile">
          <SectionHeader eyebrow="Profile" title="プロフィール">
            自己紹介とSNSリンクを設定します。公開プロフィールページは現在のデザインのまま、この情報を利用します。
          </SectionHeader>
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.22em] text-league-muted">自己紹介</span>
              <textarea name="bio" maxLength={300} defaultValue={profile.bio ?? ""} rows={5} className="premium-input mt-2" />
              <span className="mt-2 block text-xs text-league-muted">300文字以内</span>
            </label>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.22em] text-league-muted">X URL</span>
                <input name="x_url" type="url" defaultValue={profile.x_url ?? ""} placeholder="https://x.com/..." className="premium-input mt-2" />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.22em] text-league-muted">GitHub URL</span>
                <input name="github_url" type="url" defaultValue={profile.github_url ?? ""} placeholder="https://github.com/..." className="premium-input mt-2" />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.22em] text-league-muted">YouTube URL</span>
                <input name="youtube_url" type="url" defaultValue={profile.youtube_url ?? ""} placeholder="https://youtube.com/..." className="premium-input mt-2" />
              </label>
            </div>
          </div>
        </Card>

        <Card id="privacy">
          <SectionHeader eyebrow="Privacy" title="プライバシー">
            初期値はすべてONです。OFFにした項目は将来の公開制御にも利用できるよう保存します。
          </SectionHeader>
          <div className="grid gap-3 lg:grid-cols-2">
            {privacyToggles.map((item) => <ToggleRow key={item.name} item={item} checked={Boolean(settings[item.name])} />)}
          </div>
        </Card>

        <Card id="notifications">
          <SectionHeader eyebrow="Notifications" title="通知">
            現在の通知センターと将来のメール・プッシュ通知連携のために、受け取りたい通知だけを保存します。
          </SectionHeader>
          <div className="grid gap-3 lg:grid-cols-2">
            {notificationToggles.map((item) => <ToggleRow key={item.name} item={item} checked={Boolean(settings[item.name])} />)}
          </div>
        </Card>

        <Card id="display">
          <SectionHeader eyebrow="Display" title="表示">
            Darkは引き続き標準です。Lightとシステム連動はMVPでは好みとして保存し、将来のテーマ拡張に利用します。
          </SectionHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectCard name="theme" label="テーマ" description="画面全体のテーマ設定です。" value={settings.theme} options={[{ value: "dark", label: "ダーク" }, { value: "light", label: "ライト" }, { value: "system", label: "システム" }]} />
            <SelectCard name="display_density" label="表示密度" description="カードやリストの余白感の好みです。" value={settings.display_density} options={[{ value: "standard", label: "標準" }, { value: "compact", label: "コンパクト" }]} />
          </div>
        </Card>

        <Card id="navigation">
          <SectionHeader eyebrow="Navigation" title="ナビゲーション">
            下部ナビゲーションの基本構成は、ホーム・タイムライン・検索・マイページのまま維持します。ここでは現在の構成と追加候補を確認できます。
          </SectionHeader>
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4">
              <p className="text-sm font-black text-league-gold">現在の下部ナビ</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
                {currentNavigation.map((item, index) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-black/25 p-3 text-center">
                    <span className="block text-xs font-black text-league-muted">{index + 1}</span>
                    <span className="mt-1 block font-black text-white">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-black text-white">利用可能な項目</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {availableNavigation.map((item) => <PremiumBadge key={item} tone={currentNavigation.includes(item) ? "gold" : "silver"}>{item}</PremiumBadge>)}
              </div>
              <p className="mt-4 text-xs leading-5 text-league-muted">ドラッグ＆ドロップによる入れ替えは今後の拡張として扱い、MVPでは構成の見える化を優先しています。</p>
            </div>
          </div>
        </Card>

        <div className="sticky bottom-24 z-20 flex flex-col-reverse gap-3 rounded-3xl border border-white/10 bg-[#05070d]/88 p-3 shadow-2xl backdrop-blur-2xl md:bottom-5 md:flex-row md:items-center md:justify-between">
          <p className="px-2 text-xs leading-5 text-league-muted">変更はプロフィール、プライバシー、通知、表示設定にまとめて反映されます。</p>
          <Button type="submit" className="w-full md:w-auto">設定を保存</Button>
        </div>
      </form>

      <Card id="management" className="mt-8 border-red-300/20 bg-[radial-gradient(circle_at_top_right,rgba(248,113,113,0.12),transparent_30%),linear-gradient(145deg,rgba(255,255,255,0.07),rgba(8,13,26,0.76))]">
        <SectionHeader eyebrow="Account Management" title="アカウント管理">
          ログアウトはすぐに実行できます。アカウント削除は安全な削除手順が整うまで実行せず、確認と警告のみ表示します。
        </SectionHeader>
        <div className="grid gap-4 lg:grid-cols-2">
          <form action={logout} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <h3 className="text-lg font-black text-white">ログアウト</h3>
            <p className="mt-2 text-sm leading-6 text-league-silver">現在のセッションを終了してログイン画面へ移動します。</p>
            <Button type="submit" className="mt-4">ログアウト</Button>
          </form>
          <details className="rounded-2xl border border-red-300/30 bg-red-500/10 p-4">
            <summary className="cursor-pointer text-lg font-black text-red-100">アカウント削除</summary>
            <div className="mt-4 rounded-2xl border border-red-300/25 bg-black/25 p-4">
              <p className="text-sm leading-6 text-red-100">削除するとプロフィール、投稿、コメント、Rating履歴、実績などに影響します。MVPでは誤削除を防ぐため、実際の削除ボタンは無効化しています。</p>
              <button type="button" disabled className="mt-4 inline-flex cursor-not-allowed items-center justify-center rounded-full border border-red-300/30 bg-red-500/10 px-5 py-3 text-sm font-black text-red-100 opacity-60">安全な削除手順の準備中</button>
            </div>
          </details>
        </div>
      </Card>
    </PageShell>
  );
}
