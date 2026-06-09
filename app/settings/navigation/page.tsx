import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { HeroPanel, PageShell } from "@/components/ui/DesignSystem";
import { NavigationCustomizer } from "@/components/settings/NavigationCustomizer";

export default function NavigationSettingsPage() {
  return (
    <PageShell className="max-w-7xl">
      <HeroPanel eyebrow="Navigation Settings" title="ナビゲーション設定" actions={<Link href="/settings" className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white">設定へ戻る</Link>}>
        下部ナビゲーションに表示する項目を選び、上下ボタンで並び替えます。TODO: Supabaseにユーザー別メニュー設定カラムを追加後、localStorageから移行します。
      </HeroPanel>
      <Card className="mt-8"><NavigationCustomizer /></Card>
    </PageShell>
  );
}
