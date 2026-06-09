import { AdminShell, AdminTodo } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { HeroPanel, PageShell, PremiumBadge } from "@/components/ui/DesignSystem";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

const initial = ["初参加", "初回答", "初勝利", "Top10入り", "Architect到達", "Mastermind到達", "Oracle到達", "Hall of Fame入り"];
export const dynamic = "force-dynamic";
export default async function AdminAchievementsPage() { await requireAdmin(); const { data, error } = await createAdminClient().from("achievements").select("*").order("created_at", { ascending: true }); return <PageShell className="max-w-7xl"><AdminShell><HeroPanel eyebrow="Achievements" title="実績管理">実績の一覧、編集、手動付与の準備画面です。</HeroPanel><Card className="mt-6"><AdminTodo>achievementsテーブルは存在します。enable/disableとmanual grantは監査ログ・権限設計が未実装のため無効化しています。</AdminTodo><div className="mt-5 flex flex-wrap gap-2">{initial.map((i)=><PremiumBadge key={i} tone="gold">{i}</PremiumBadge>)}</div>{error ? <p className="mt-4 text-red-200">実績取得に失敗しました: {error.message}</p> : null}<div className="mt-5 grid gap-3 md:grid-cols-2">{(data ?? []).map((a)=><div key={a.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-lg font-black text-white">{a.title}</p><p className="mt-1 text-sm leading-6 text-league-silver">{a.description}</p><p className="mt-2 text-xs text-league-muted">key: {a.key ?? a.id}</p><button disabled className="mt-3 rounded-full border border-white/10 px-3 py-1.5 text-xs font-black text-league-muted opacity-60">編集（準備中）</button></div>)}</div></Card></AdminShell></PageShell>; }
