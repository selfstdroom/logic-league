import Image from "next/image";
import Link from "next/link";
import { RankBadge } from "@/components/rank/RankBadge";

const ranks = ["Challenger", "Analyst", "Strategist", "Architect", "Mastermind", "Oracle"] as const;
const discussionExamples = [
  { label: "都市", title: "生成AI時代の公共教育をどう再設計するか" },
  { label: "事業", title: "高齢化地域で持続する小規模モビリティの条件" },
  { label: "倫理", title: "効率と公平が衝突したとき、何を優先するか" },
];
const fameHighlights = ["構造の美しさ", "反論への強さ", "実現可能性", "独創的な仮説"];

export default function Page() {
  return (
    <main className="relative overflow-hidden pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-0">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_50%_0%,rgba(215,180,106,0.18),transparent_36rem)]" aria-hidden="true" />
      <section className="relative mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:min-h-screen lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-10 lg:py-16">
        <div className="rounded-[2rem] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(255,255,255,0.075),rgba(255,255,255,0.018))] p-5 shadow-[0_30px_110px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.1)] sm:p-8 lg:p-10">
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] border border-amber-100/20 bg-[radial-gradient(circle_at_35%_20%,rgba(215,180,106,0.3),transparent_45%),linear-gradient(145deg,#111827,#020204)] shadow-[0_26px_70px_rgba(0,0,0,0.35),0_0_60px_rgba(215,180,106,0.1)] sm:h-28 sm:w-28 lg:h-32 lg:w-32">
              <Image src="/logo.png" alt="Logic League" width={160} height={160} className="h-full w-full scale-[1.16] rounded-[2rem] object-cover" priority />
            </div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.34em] text-league-gold">Logic League</p>
            <h1 className="mt-4 max-w-4xl text-[2.75rem] font-black leading-[0.98] tracking-[-0.08em] text-white sm:text-6xl lg:text-7xl">
              知識ではなく、
              <br />
              思考で競え。
            </h1>
            <p className="mt-5 max-w-2xl text-[0.98rem] font-medium leading-8 text-league-silver sm:text-lg sm:leading-9">
              課題解決型の問いに回答し、AI採点・議論・競技を通じて思考力の実績を積み上げる知的競技プラットフォーム。
            </p>
            <div className="mt-7 grid w-full grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:w-auto sm:flex sm:flex-wrap">
              <Link href="/exam" className="inline-flex min-h-[3.25rem] items-center justify-center rounded-full border border-amber-100/55 bg-[linear-gradient(180deg,#f4d78d_0%,#c79a3d_100%)] px-7 py-3.5 text-sm font-black text-[#11100b] shadow-[0_16px_40px_rgba(199,154,61,0.25),inset_0_1px_0_rgba(255,255,255,0.62)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-200/45">
                認定試験を受ける
              </Link>
              <Link href="/login" className="inline-flex min-h-[3.25rem] items-center justify-center rounded-full border border-white/14 bg-white/[0.055] px-7 py-3.5 text-sm font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/[0.085] focus:outline-none focus:ring-2 focus:ring-amber-200/35">
                ログイン
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:gap-5">
          <section className="rounded-[2rem] border border-amber-300/18 bg-[#080c14]/90 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.38)] sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">Rank Evolution</p>
                <h2 className="mt-2 text-2xl font-black text-white">思考の階層を上がる</h2>
              </div>
              <Link href="/ranks" className="hidden rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-xs font-black text-league-silver transition hover:border-amber-300/30 hover:text-white sm:inline-flex">全Rank</Link>
            </div>
            <div className="mt-5 -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0 lg:pb-0">
              {ranks.map((rank, index) => (
                <div key={rank} className="relative min-w-[8.6rem] snap-center rounded-3xl border border-white/10 bg-white/[0.035] p-4 text-center lg:min-w-0">
                  <RankBadge rank={rank} size="md" showLabel labelPlacement="bottom" />
                  {index < ranks.length - 1 ? <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-league-gold/70 lg:block">→</span> : null}
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">Competitive Discussion</p>
              <h2 className="mt-2 text-2xl font-black text-white">週次の知的競技</h2>
              <p className="mt-3 text-sm leading-7 text-league-silver">匿名投稿、AI採点、投票、結果公開を通じて、回答の説得力と構造を競います。</p>
              <div className="mt-4 space-y-2.5">
                {discussionExamples.map((example) => (
                  <div key={example.title} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                    <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-league-gold">{example.label}</span>
                    <p className="mt-1 text-sm font-bold leading-6 text-white">{example.title}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-300/18 bg-[radial-gradient(circle_at_top_right,rgba(215,180,106,0.16),transparent_42%),rgba(255,255,255,0.035)] p-5 sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">Hall of Fame</p>
              <h2 className="mt-2 text-2xl font-black text-white">名回答が残る場所</h2>
              <p className="mt-3 text-sm leading-7 text-league-silver">競技で評価された回答は、思考の作品としてHall of Fameに蓄積されます。</p>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                {fameHighlights.map((item) => <span key={item} className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-3 py-3 text-center text-xs font-black text-amber-100">{item}</span>)}
              </div>
              <Link href="/hall-of-fame" className="mt-5 inline-flex min-h-11 items-center rounded-full border border-amber-300/30 bg-black/25 px-5 py-2 text-sm font-black text-league-gold transition hover:bg-amber-300/15 hover:text-white">殿堂を見る</Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
