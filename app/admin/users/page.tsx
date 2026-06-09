import Link from "next/link";
import { AdminShell, AdminTodo } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { PremiumAvatar } from "@/components/ui/PremiumAvatar";
import { HeroPanel, PageShell } from "@/components/ui/DesignSystem";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const q = (await searchParams).q?.trim() ?? "";
  const admin = createAdminClient();
  let query = admin.from("profiles").select("*").order("created_at", { ascending: false }).limit(50);
  if (q) query = query.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`);
  const { data: users, error } = await query;
  return <PageShell className="max-w-7xl"><AdminShell><HeroPanel eyebrow="User Management" title="ユーザー管理">ユーザー検索、Rank/Rating/Archetype確認、制限操作の安全な入口です。</HeroPanel><Card className="mt-6"><form className="flex gap-3"><input name="q" defaultValue={q} className="premium-input" placeholder="username / display name" /><button className="rounded-full bg-gradient-to-r from-amber-300 to-yellow-600 px-5 py-3 text-sm font-black text-black">検索</button></form><div className="mt-4"><AdminTodo>手動Rank/Rating変更・制限・Admin付与は専用監査ログと確認モーダルが未整備のため無効化しています。</AdminTodo></div>{error ? <p className="mt-4 text-red-200">ユーザー取得に失敗しました: {error.message}</p> : null}<div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs uppercase tracking-[0.18em] text-league-muted"><tr><th className="p-3">User</th><th className="p-3">Email</th><th className="p-3">Rank</th><th className="p-3">Rating</th><th className="p-3">Archetype</th><th className="p-3">Created</th><th className="p-3">Actions</th></tr></thead><tbody>{(users ?? []).map((u)=><tr key={u.id} className="border-t border-white/10"><td className="p-3 font-black text-white"><div className="flex min-w-0 items-center gap-3"><PremiumAvatar avatarUrl={u.avatar_url} displayName={u.display_name} username={u.username} rank={u.rank} size="small" /><span className="min-w-0"><span className="block truncate">{u.display_name ?? u.username}</span><span className="block truncate text-xs text-league-muted">@{u.username}</span></span></div></td><td className="p-3 text-league-silver">{u.email ?? "未取得"}</td><td className="p-3 text-league-silver">{u.rank}</td><td className="p-3 text-league-silver">{u.rating}</td><td className="p-3 text-league-silver">{u.archetype ?? "-"}</td><td className="p-3 text-league-muted">{new Date(u.created_at).toLocaleDateString("ja-JP")}</td><td className="p-3"><Link href={`/profile/${u.username}`} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-black text-league-silver">Profile</Link></td></tr>)}</tbody></table></div></Card></AdminShell></PageShell>;
}
