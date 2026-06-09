import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { LeagueIcon, type LeagueIconName } from "@/components/ui/LeagueIcon";

export const adminNavItems: { href: string; label: string; description: string; icon: LeagueIconName }[] = [
  { href: "/admin", label: "ダッシュボード", description: "運営概況", icon: "leaderboard" },
  { href: "/admin/topics", label: "議論管理", description: "Daily / Special", icon: "dailyDiscussions" },
  { href: "/admin/weekly", label: "競技議論", description: "Weekly運営", icon: "weeklyLeague" },
  { href: "/admin/answers", label: "回答管理", description: "非表示・殿堂候補", icon: "answer" },
  { href: "/admin/users", label: "ユーザー管理", description: "検索・制限", icon: "profile" },
  { href: "/admin/reports", label: "通報管理", description: "未処理確認", icon: "notifications" },
  { href: "/admin/hall-of-fame", label: "殿堂管理", description: "掲載・順序", icon: "hallOfFame" },
  { href: "/admin/achievements", label: "実績管理", description: "称号・付与", icon: "achievements" },
  { href: "/admin/settings", label: "サイト設定", description: "告知・文言", icon: "settings" },
  { href: "/admin/operations", label: "運用ノート", description: "改善メモ", icon: "bookmarks" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="xl:sticky xl:top-6 xl:h-fit">
        <Card className="p-4">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-league-gold">Admin Menu</p>
          <nav className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {adminNavItems.map((item) => <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 transition hover:border-amber-300/30 hover:bg-white/[0.06]"><LeagueIcon name={item.icon} size={18} className="text-league-gold" /><span><span className="block text-sm font-black text-white">{item.label}</span><span className="block text-[0.68rem] text-league-muted">{item.description}</span></span></Link>)}
          </nav>
        </Card>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function AdminTodo({ children = "TODO: 現在のDBスキーマに専用カラムまたはテーブルが無いため、操作ボタンは安全なプレースホルダーです。" }: { children?: React.ReactNode }) {
  return <div className="rounded-2xl border border-sky-300/25 bg-sky-400/10 p-4 text-sm font-bold leading-6 text-sky-100">{children}</div>;
}
