import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { HeroPanel, PageShell, SectionHeader } from "@/components/ui/DesignSystem";
import { LeagueIcon } from "@/components/ui/LeagueIcon";

const settingsItems = [
  { label: "プロフィール設定", description: "表示名、自己紹介、SNSリンクはプロフィール編集から変更できます。", href: "/profile/edit", icon: "profile" as const },
  { label: "通知設定", description: "通知センターでリーグ内の更新を確認できます。", href: "/notifications", icon: "notifications" as const },
  { label: "保存済み項目", description: "ブックマークした議論や回答を確認します。", href: "/bookmarks", icon: "bookmarks" as const },
];

export default function SettingsPage() {
  return (
    <PageShell>
      <HeroPanel eyebrow="設定" title="アカウントとリーグ体験の管理">
        現在のナビゲーション構造を保ちながら、プロフィールとリーグ体験に関する入口を整理しています。
      </HeroPanel>
      <section className="mt-8">
        <SectionHeader eyebrow="Settings" title="設定メニュー" />
        <div className="grid gap-4 md:grid-cols-3">
          {settingsItems.map((item) => (
            <Link key={item.label} href={item.href} className="block">
              <Card className="h-full transition hover:-translate-y-1 hover:border-amber-300/35 hover:bg-white/[0.06]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-300/10 text-league-gold">
                  <LeagueIcon name={item.icon} size={22} />
                </div>
                <h2 className="mt-4 text-xl font-black text-white">{item.label}</h2>
                <p className="mt-2 text-sm leading-6 text-league-silver">{item.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
