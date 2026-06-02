import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { archetypes } from "@/lib/archetypes";
import { getUpperPercentile } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/server";
import type { ArchetypeName } from "@/types/logic-league";

export default async function ResultPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: result } = await supabase.from("exam_answers").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!result) redirect("/exam");

  const archetype = archetypes[result.archetype as ArchetypeName] ?? archetypes.Analyst;
  const scores = [
    ["構造化能力", result.structure_score],
    ["仮説構築力", result.hypothesis_score],
    ["独創性", result.originality_score],
    ["実現可能性", result.feasibility_score],
    ["リスク分析", result.risk_score],
  ] as const;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-league-gold">Certification Result</p>
        <h1 className="mt-3 text-4xl font-black">認定結果</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="text-center">
          <p className="text-league-muted">推定思考偏差値</p>
          <div className="my-4 text-8xl font-black text-league-gold">{result.predicted_deviation}</div>
          <p className="text-league-silver">上位目安：{getUpperPercentile(result.predicted_deviation)}</p>
          <p className={`mt-4 rounded-full px-4 py-2 text-sm font-bold ${result.qualified ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-league-silver"}`}>
            参加資格：{result.qualified ? "獲得" : "未獲得"}
          </p>
          <p className="mt-6 text-2xl font-bold text-white">{result.headline}</p>
        </Card>
        <Card>
          <p className="text-sm text-league-muted">思考アーキタイプ</p>
          <h2 className="mt-2 text-4xl font-black text-white">{result.archetype}</h2>
          <p className="mt-1 text-league-gold">{archetype.ja}</p>
          <p className="mt-4 leading-7 text-league-silver">{archetype.description}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <p className="rounded-2xl bg-white/[0.04] p-4 text-sm text-league-silver"><span className="block font-bold text-white">強み傾向</span>{archetype.strength}</p>
            <p className="rounded-2xl bg-white/[0.04] p-4 text-sm text-league-silver"><span className="block font-bold text-white">注意傾向</span>{archetype.weakness}</p>
          </div>
        </Card>
      </div>
      <Card className="mt-6">
        <h2 className="mb-5 text-2xl font-black">能力スコア</h2>
        <div className="space-y-4">
          {scores.map(([label, score]) => (
            <div key={label}>
              <div className="mb-2 flex justify-between text-sm"><span>{label}</span><span className="text-league-gold">{score}/20</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-league-gold" style={{ width: `${(score / 20) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </Card>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card><h3 className="mb-3 font-bold text-league-gold">AI総評</h3><p className="leading-8 text-league-silver">{result.summary}</p></Card>
        <Card><h3 className="mb-3 font-bold text-league-gold">強み</h3><p className="leading-8 text-league-silver">{result.strength}</p></Card>
        <Card><h3 className="mb-3 font-bold text-league-gold">弱み</h3><p className="leading-8 text-league-silver">{result.weakness}</p></Card>
        <Card><h3 className="mb-3 font-bold text-league-gold">上位層との差</h3><p className="leading-8 text-league-silver">{result.upper_gap}</p></Card>
      </div>
      <p className="mt-8 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">本結果はAIによる推定であり、正式なIQ検査・心理検査・学術的知能検査ではありません。</p>
      <div className="mt-8 text-center"><ButtonLink href="/home">Logic Leagueへ進む</ButtonLink></div>
    </main>
  );
}
