import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { FeatureExplanation } from "@/components/ui/FeatureExplanation";
import { HeroPanel, PageShell, PremiumBadge, SectionHeader, StatCard } from "@/components/ui/DesignSystem";
import { OnboardingHint } from "@/components/ui/OnboardingHint";
import { AdminShell } from "@/components/admin/AdminShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const adminSections = [
  { title: "議論管理", href: "/admin/topics", items: ["Daily議論を作成", "Special管理", "締切", "Feature", "Archive"] },
  { title: "競技議論管理", href: "/admin/weekly", items: ["回答受付", "匿名公開", "投票期間", "結果確定", "Rating更新導線"] },
  { title: "回答管理", href: "/admin/answers", items: ["回答一覧", "非表示", "Featured", "Hall of Fame候補", "通報確認"] },
  { title: "ユーザー管理", href: "/admin/users", items: ["ユーザー検索", "Rank", "Rating", "制限", "権限確認"] },
  { title: "通報・殿堂・実績", href: "/admin/reports", items: ["通報を見る", "Hall of Fame候補", "実績", "手動付与準備"] },
  { title: "サイト設定・運用ノート", href: "/admin/settings", items: ["告知", "メンテ表示", "運用メモ", "Launch checklist"] },
];


function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export default async function AdminPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { start, end } = todayRange();

  const [todayPosts, answers, activeUsers, votes, reports, pendingTopics, activeWeekly, hallOfFameCandidates] = await Promise.all([
    admin.from("topics").select("id", { count: "exact", head: true }).gte("created_at", start).lt("created_at", end),
    admin.from("topic_answers").select("id", { count: "exact", head: true }).gte("created_at", start).lt("created_at", end),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", start).lt("created_at", end),
    admin.from("likes").select("id", { count: "exact", head: true }),
    admin.from("comments").select("id", { count: "exact", head: true }).gte("created_at", start).lt("created_at", end),
    admin.from("topics").select("id", { count: "exact", head: true }).eq("status", "draft"),
    admin.from("topics").select("id", { count: "exact", head: true }).eq("type", "weekly").eq("status", "published"),
    admin.from("topic_answers").select("id", { count: "exact", head: true }).not("final_score", "is", null),
  ]);

  const metrics = [
    { label: "今日の投稿数", value: todayPosts.count ?? 0, description: "本日作成されたTopic" },
    { label: "今日の回答数", value: answers.count ?? 0, description: "回答数（現行は累計）" },
    { label: "新規ユーザー数", value: activeUsers.count ?? 0, description: "登録プロフィール（現行は累計）" },
    { label: "投票数", value: votes.count ?? 0, description: "累計いいね / 投票" },
    { label: "未処理通報数", value: reports.count ?? 0, description: "reports未実装のためコメント参考値" },
    { label: "開催中の競技議論", value: activeWeekly.count ?? 0, description: "公開中Weekly" },
    { label: "締切済み未集計", value: pendingTopics.count ?? 0, description: "下書き / 公開待ち参考値" },
    { label: "Hall of Fame候補数", value: hallOfFameCandidates.count ?? 0, description: "score付き回答参考値" },
  ];

  return (
    <PageShell className="max-w-7xl"><AdminShell>
      <OnboardingHint storageKey="logic-league:onboarding:admin" title="Admin Command Center" className="mb-5">
        議題、回答、ユーザー、競技進行を管理します。管理者のみが見える運用ダッシュボードです。
      </OnboardingHint>
      <HeroPanel eyebrow="Admin Command Center" title="運営ダッシュボード">
        Logic Leagueの議論・回答・ユーザー・競技・実績を段階的に拡張するための管理ホームです。現時点では既存機能への導線と運用指標を整理しています。
      </HeroPanel>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => <StatCard key={metric.label} label={metric.label} value={metric.value} description={metric.description} tone={index === 0 || index === 5 ? "gold" : "silver"} />)}
      </section>

      <FeatureExplanation className="mt-8" compact showAdmin intro="ユーザー向け機能と管理者向け機能の役割を同じ地図で確認できます。" />

      <section className="mt-8 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
        <Card>
          <SectionHeader eyebrow="Today" title="本日の確認" />
          <div className="mt-4 space-y-3">
            {["公開予定Topicと締切の整合性を確認", "Weeklyの匿名公開・投票期間を確認", "Hall of Fame候補回答を確認", "不適切投稿・通報導線を確認"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                <span className="h-2.5 w-2.5 rounded-full bg-league-gold" />
                <p className="text-sm font-bold text-league-silver">{item}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader eyebrow="Structure" title="管理領域" action={<PremiumBadge tone="gold">Scalable Plan</PremiumBadge>}>
            大きな新機能は追加せず、次フェーズで実装しやすいカード構造として整理しています。
          </SectionHeader>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {adminSections.map((section) => (
              <Link key={section.title} href={section.href} className="rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4 transition hover:-translate-y-0.5 hover:border-amber-300/30 hover:bg-white/[0.06]">
                <h2 className="text-lg font-black text-white">{section.title}</h2>
                <ul className="mt-3 space-y-1.5 text-sm leading-6 text-league-silver">
                  {section.items.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </AdminShell></PageShell>
  );
}
