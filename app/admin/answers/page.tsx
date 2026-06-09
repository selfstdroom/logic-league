import Link from "next/link";
import { AdminShell, AdminTodo } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { HeroPanel, PageShell, PremiumBadge } from "@/components/ui/DesignSystem";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminAnswersPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: answers, error } = await admin.from("topic_answers").select("*").order("created_at", { ascending: false }).limit(40);
  return <PageShell className="max-w-7xl"><AdminShell><HeroPanel eyebrow="Answer Management" title="回答管理">回答の確認、通報・殿堂候補の確認、非表示/Featured化の運用画面です。</HeroPanel><Card className="mt-6"><AdminTodo>hide / featured / Hall of Fame候補フラグは現行スキーマに専用列が無いため、一覧・確認導線のみ実装しています。削除は既定では行いません。</AdminTodo><div className="mt-5 flex flex-wrap gap-2">{["discussion", "user", "date", "reported", "Hall of Fame candidate"].map((f)=><PremiumBadge key={f}>{f}</PremiumBadge>)}</div>{error ? <p className="mt-4 text-red-200">回答取得に失敗しました: {error.message}</p> : null}<div className="mt-5 space-y-3">{(answers ?? []).map((a)=><div key={a.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex flex-wrap justify-between gap-2 text-xs text-league-muted"><span>{new Date(a.created_at).toLocaleString("ja-JP")}</span><span>score: {a.final_score ?? a.ai_total_score ?? "未集計"}</span></div><p className="mt-2 line-clamp-3 text-sm leading-6 text-white">{a.content}</p><div className="mt-3 flex flex-wrap gap-2"><Link href={`/topics/${a.topic_id}`} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-black text-league-silver">議論を見る</Link><button disabled className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-black text-league-muted opacity-50">非表示（準備中）</button><button disabled className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-xs font-black text-league-gold opacity-60">殿堂へ追加（準備中）</button></div></div>)}</div></Card></AdminShell></PageShell>;
}
