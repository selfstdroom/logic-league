import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <section>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.35em] text-league-gold">Logic League</p>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">知識ではなく、<br />思考で競え。</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-league-silver">
            Logic Leagueは、課題解決型の問いに回答し、AI採点とリーグ戦を通じて思考力の実績を蓄積する知的競技サービスです。
            第1段階では初回認定試験によって、推定思考偏差値・参加資格・思考アーキタイプを判定します。
          </p>
          <div className="mt-7 flex flex-wrap gap-4">
            <ButtonLink href="/exam">認定試験を受ける</ButtonLink>
            <ButtonLink href="/login" className="bg-none bg-white/10 text-white shadow-none ring-1 ring-white/15">ログイン</ButtonLink>
          </div>
          <p className="mt-4 text-sm text-league-muted">本結果はAIによる推定であり、正式なIQ検査・心理検査・学術的知能検査ではありません。</p>
        </section>
        <Card className="relative overflow-hidden p-5 sm:p-6">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-league-gold/20 blur-3xl" />
          <p className="text-sm font-bold text-league-gold">認定試験</p>
          <div className="mt-5 space-y-3">
            {["構造化能力", "仮説構築力", "独創性", "実現可能性", "リスク分析"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                <span className="text-league-silver">{item}</span>
                <span className="text-league-gold">20点</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <section className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-league-gold">New user journey</p>
        <h2 className="mt-2 text-2xl font-black text-white">HomeからTimeline掲載まで</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-5">
          {["Home", "認定試験", "初めての議論", "実績解除", "Timeline掲載"].map((step, index) => (
            <div key={step} className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-league-muted">Step {index + 1}</p>
              <p className="mt-1 text-sm font-black text-white">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
