import { EmptyState } from "@/components/ui/EmptyState";
import { HeroPanel, PageShell } from "@/components/ui/DesignSystem";

export default function NotificationsPage() {
  return (
    <PageShell>
      <HeroPanel eyebrow="通知" title="リーグからのシグナル">
        コメント、実績、Rank変動、Weekly Leagueの更新など、重要な動きを確認するためのページです。
      </HeroPanel>
      <section className="mt-8">
        <EmptyState kind="notifications" title="新しい通知はありません。">
          あなたの回答への反応やリーグの更新が届くと、ここに整理して表示されます。
        </EmptyState>
      </section>
    </PageShell>
  );
}
