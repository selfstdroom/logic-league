import { redirect } from "next/navigation";
import { ExamForm } from "@/components/exam/ExamForm";
import { Card } from "@/components/ui/Card";
import { HeroPanel, PageShell, StatCard } from "@/components/ui/DesignSystem";
import { createClient } from "@/lib/supabase/server";

export default async function ExamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <PageShell className="max-w-5xl">
      <HeroPanel eyebrow="Phase 1 Certification" title="第1回 認定試験">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Duration" value="30分" />
          <StatCard label="Questions" value="1問" tone="gold" />
          <StatCard label="Minimum" value="500字" />
        </div>
      </HeroPanel>
      <Card className="mb-8 mt-8">
        <p className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">
          本結果はAIによる推定であり、正式なIQ検査・心理検査・学術的知能検査ではありません。
        </p>
        <div className="space-y-4 leading-8 text-league-silver">
          <p>あなたは人口50万人の地方都市の市長です。この都市では20年間、人口減少が続いています。若年層は都市部へ流出し、出生数も減少しています。</p>
          <p>使える予算は100億円です。国からの追加支援は期待できません。</p>
          <p className="text-white">あなたなら、10年後に人口減少を止めるために、最初の3年間で何を行いますか。</p>
          <ol className="list-decimal space-y-2 pl-6 text-white">
            <li>本当の問題は何か</li>
            <li>なぜその問題が起きていると考えるか</li>
            <li>最初の3年間で実行する施策</li>
            <li>その施策が失敗するとしたら何が原因か</li>
            <li>失敗を防ぐために何をするか</li>
          </ol>
        </div>
      </Card>
      <ExamForm />
    </PageShell>
  );
}
