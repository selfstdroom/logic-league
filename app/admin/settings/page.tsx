import { AdminShell, AdminTodo } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { HeroPanel, PageShell } from "@/components/ui/DesignSystem";
import { requireAdmin } from "@/lib/admin";

const fields = ["Landing page headline", "Landing page description", "Current featured discussion", "Maintenance message", "Announcement banner"];
export default async function AdminSettingsPage() { await requireAdmin(); return <PageShell className="max-w-7xl"><AdminShell><HeroPanel eyebrow="Site Content" title="サイト設定">ランディング文言、注目議論、メンテナンスメッセージ、告知バナーを管理するページです。</HeroPanel><Card className="mt-6"><AdminTodo>app_settings等のDBサポートが未実装のため、入力欄はUIのみです。保存成功を偽装しません。</AdminTodo><div className="mt-5 grid gap-4">{fields.map((field)=><label key={field} className="block rounded-2xl border border-white/10 bg-black/20 p-4"><span className="text-sm font-black text-white">{field}</span><input disabled className="premium-input mt-2 opacity-60" placeholder="DB接続後に編集可能" /></label>)}</div><button disabled className="mt-5 rounded-full bg-gradient-to-r from-amber-300 to-yellow-600 px-5 py-3 text-sm font-black text-black opacity-50">保存（準備中）</button></Card></AdminShell></PageShell>; }
