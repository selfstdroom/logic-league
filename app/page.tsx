import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <section>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.35em] text-league-gold">Logic League</p>
          <h1 className="text-5xl font-black leading-tight tracking-tight text-white md:text-7xl">知識ではなく、<br />思考で競え。</h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-league-silver">
            Logic Leagueは、課題解決型の問いに回答し、AI採点とリーグ戦を通じて思考力の実績を蓄積する知的競技Webアプリです。
            Phase 1では初回認定試験によって、推定思考偏差値・参加資格・思考アーキタイプを判定します。
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <ButtonLink href="/exam">認定試験を受ける</ButtonLink>
            <ButtonLink href="/login" className="bg-none bg-white/10 text-white shadow-none ring-1 ring-white/15">ログイン</ButtonLink>
          </div>
          <p className="mt-6 text-sm text-league-muted">本結果はAIによる推定であり、正式なIQ検査・心理検査・学術的知能検査ではありません。</p>
        </section>
        <Card className="relative overflow-hidden p-8">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-league-gold/20 blur-3xl" />
          <p className="text-sm font-bold text-league-gold">CERTIFICATION EXAM</p>
          <div className="mt-8 space-y-5">
            {["構造化能力", "仮説構築力", "独創性", "実現可能性", "リスク分析"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                <span className="text-league-silver">{item}</span>
                <span className="text-league-gold">20 pts</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
