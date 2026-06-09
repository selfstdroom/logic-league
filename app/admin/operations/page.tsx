import { AdminShell } from "@/components/admin/AdminShell";
import { OperationsNotes } from "@/components/admin/OperationsNotes";
import { Card } from "@/components/ui/Card";
import { HeroPanel, PageShell, PremiumBadge } from "@/components/ui/DesignSystem";
import { requireAdmin } from "@/lib/admin";

export default async function AdminOperationsPage() { await requireAdmin(); return <PageShell className="max-w-7xl"><AdminShell><HeroPanel eyebrow="Operations" title="運用ノート">Weekly improvement notes、Bug notes、Future discussion ideas、Launch checklistをローカル保存します。</HeroPanel><Card className="mt-6"><div className="mb-4 flex flex-wrap gap-2">{["Weekly improvements", "Bug notes", "Future discussion ideas", "Launch checklist"].map((i)=><PremiumBadge key={i}>{i}</PremiumBadge>)}</div><OperationsNotes /><p className="mt-3 text-xs text-league-muted">保存先: logic-league-admin-operations-notes（localStorage）。TODO: 内部運用テーブル追加後にDB保存へ移行。</p></Card></AdminShell></PageShell>; }
