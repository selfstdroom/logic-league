import type { ReactNode } from "react";
import Link from "next/link";
import { LeagueIcon, type LeagueIconName } from "@/components/ui/LeagueIcon";

const coreFeatures: { title: string; description: string; href?: string; icon: LeagueIconName; adminOnly?: boolean }[] = [
  { title: "認定試験", description: "課題解決型の長文回答で、参加資格・初期Rating・思考タイプを測ります。", href: "/exam", icon: "answer" },
  { title: "思考偏差値", description: "認定・週次競技・Season平均から、思考の伸びを複数の角度で表示します。", href: "/profile", icon: "rankUp" },
  { title: "Daily Discussion", description: "日々の問いに回答し、根拠・構造・反論耐性を磨く通常議論です。", href: "/topics", icon: "dailyDiscussions" },
  { title: "Competitive Discussion", description: "匿名投稿、AI採点、投票、結果公開で競う週次リーグです。", href: "/weekly", icon: "weeklyLeague" },
  { title: "Debate Layer", description: "回答に対して反論・補足・質問を重ね、議論を深く掘り下げます。", href: "/timeline", icon: "counter" },
  { title: "Timeline", description: "回答・反論・再反論・補足・質問だけが流れる思考フィードです。", href: "/timeline", icon: "timeline" },
  { title: "Rank System", description: "ChallengerからOracleまで、Ratingに応じてランクが進化します。", href: "/ranks", icon: "rankUp" },
  { title: "Leaderboard", description: "Competitive Discussionの成績とRatingで全体順位を確認できます。", href: "/leaderboard", icon: "leaderboard" },
  { title: "Hall of Fame", description: "優れた回答が保存され、勝者の思考資産として残ります。", href: "/hall-of-fame", icon: "hallOfFame" },
  { title: "Profile", description: "ランク、Rating、代表回答、実績、思考ログをまとめた公開ポートフォリオです。", href: "/profile", icon: "profile" },
  { title: "Admin functions", description: "管理者のみ、議題・回答・ユーザー・競技進行を管理します。", href: "/admin", icon: "settings", adminOnly: true },
];

export function FeatureExplanation({ title = "Logic Leagueでできること", intro, compact = false, showAdmin = false, className = "" }: { title?: ReactNode; intro?: ReactNode; compact?: boolean; showAdmin?: boolean; className?: string }) {
  const features = showAdmin ? coreFeatures : coreFeatures.filter((feature) => !feature.adminOnly);
  return (
    <section className={className} aria-labelledby="feature-explanation-title">
      <div className="mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.26em] text-league-gold">Feature Map</p>
          <h2 id="feature-explanation-title" className="mt-1 text-2xl font-black leading-tight text-white sm:text-3xl">{title}</h2>
          {intro ? <div className="mt-2 max-w-3xl text-sm leading-7 text-league-silver">{intro}</div> : null}
        </div>
      </div>
      <div className={`grid gap-3 ${compact ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {features.map((feature) => {
          const content = (
            <>
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-league-gold">
                  <LeagueIcon name={feature.icon} size={19} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-black leading-snug text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-7 text-league-silver">{feature.description}</p>
                </div>
              </div>
              {feature.adminOnly ? <span className="mt-3 inline-flex rounded-full border border-rose-300/25 bg-rose-500/10 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.16em] text-rose-200">Admin only</span> : null}
            </>
          );
          const classes = "block h-full rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4 transition hover:border-amber-300/30 hover:bg-white/[0.06] sm:p-5";
          return feature.href ? <Link key={feature.title} href={feature.href} className={classes}>{content}</Link> : <div key={feature.title} className={classes}>{content}</div>;
        })}
      </div>
    </section>
  );
}
