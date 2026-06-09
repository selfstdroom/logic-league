import { AdminShell, AdminTodo } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { HeroPanel, PageShell } from "@/components/ui/DesignSystem";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminHallOfFamePage() {
  await requireAdmin();
  const { data, error } = await createAdminClient().from("hall_of_fame").select("*").order("created_at", { ascending: false }).limit(50);
  return <PageShell className="max-w-7xl"><AdminShell><HeroPanel eyebrow="Hall of Fame" title="殿堂管理">Hall of Fame掲載、タイトル/説明、Featured順、Season/Yearを管理する画面です。</HeroPanel><Card className="mt-6"><AdminTodo>現行hall_of_fameはscore系の最小スキーマです。title / description / featured_order / season_year列が追加されたら編集を有効化します。</AdminTodo>{error ? <p className="mt-4 text-red-200">殿堂取得に失敗しました: {error.message}</p> : null}<div className="mt-5 grid gap-3 md:grid-cols-2">{(data ?? []).map((e)=><div key={e.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-lg font-black text-league-gold">Hall of Fame Badge Preview</p><p className="mt-2 text-sm text-league-silver">final: {e.final_score ?? "-"} / ai: {e.ai_total_score ?? "-"} / vote: {e.vote_count ?? "-"}</p><button disabled className="mt-3 rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1.5 text-xs font-black text-red-100 opacity-60">掲載解除（準備中）</button></div>)}</div></Card></AdminShell></PageShell>;
}
