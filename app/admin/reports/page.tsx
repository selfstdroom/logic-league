import { AdminShell, AdminTodo } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { HeroPanel, PageShell, PremiumBadge } from "@/components/ui/DesignSystem";
import { requireAdmin } from "@/lib/admin";

export default async function AdminReportsPage() {
  await requireAdmin();
  return <PageShell className="max-w-7xl"><AdminShell><HeroPanel eyebrow="Reports" title="通報管理">reported answers/commentsの処理ステータスを管理するページです。</HeroPanel><Card className="mt-6"><AdminTodo>reportsテーブルが現行スキーマに無いため、UIプレースホルダーです。TODO: report対象、reporter、status、resolution_noteを持つテーブルを追加します。</AdminTodo><div className="mt-5 flex flex-wrap gap-2">{["open", "reviewing", "resolved", "dismissed"].map((s)=><PremiumBadge key={s} tone={s === "open" ? "gold" : "silver"}>{s}</PremiumBadge>)}</div><div className="mt-5 grid gap-3 md:grid-cols-2"><button disabled className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left text-league-silver opacity-60">コンテンツを非表示（準備中）</button><button disabled className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left text-league-silver opacity-60">通報を却下（準備中）</button><button disabled className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left text-league-silver opacity-60">解決済みにする（準備中）</button><button disabled className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left text-league-silver opacity-60">報告者を見る（準備中）</button></div></Card></AdminShell></PageShell>;
}
