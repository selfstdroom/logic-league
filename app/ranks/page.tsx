import { RankBadge } from "@/components/rank/RankBadge";
import { Card } from "@/components/ui/Card";
import { HeroPanel, PageShell, SectionHeader } from "@/components/ui/DesignSystem";
import { RANK_DEFINITIONS } from "@/lib/rank";

export default function RanksPage() {
  return (
    <PageShell>
      <HeroPanel eyebrow="Ranks" title="思考の階層と到達目標">
        Logic Leagueでは、Weekly Leagueの結果に応じてRatingが上昇し、Rankが自動更新されます。各Rankは思考力の現在地を示す公開バッジです。
      </HeroPanel>
      <section className="mt-10">
        <SectionHeader eyebrow="Rank Progress" title="全Rank一覧">
          1位は+50、2位は+40、3位は+30、4〜10位は+10、参加者は+2。現時点ではRating減少はありません。
        </SectionHeader>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {RANK_DEFINITIONS.map((rank) => (
            <Card key={rank.name} className="group hover:-translate-y-1 hover:border-amber-300/35 hover:bg-white/[0.06]">
              <div className="flex items-center gap-4">
                <RankBadge rank={rank.name} size="sm" />
                <div>
                  <h2 className="text-2xl font-black text-white">{rank.name}</h2>
                  <p className="mt-1 text-sm font-bold text-league-gold">Rating {rank.range}</p>
                </div>
              </div>
              <p className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-7 text-league-silver">「{rank.description}」</p>
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
