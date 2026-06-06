import Image from "next/image";
import Link from "next/link";

const examCriteria = ["構造化能力", "仮説構築力", "独創性", "実現可能性", "リスク分析"];

export default function Page() {
  return (
    <main className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-6xl flex-col justify-center overflow-hidden px-4 pb-8 pt-5 sm:px-6 sm:pb-12 sm:pt-8 lg:min-h-[calc(100svh-4.5rem)]">
      <div className="pointer-events-none absolute left-1/2 top-3 h-40 w-[86%] -translate-x-1/2 rounded-full border border-white/[0.06] bg-white/[0.025] blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/35 to-transparent" aria-hidden="true" />

      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1.04fr)_minmax(330px,0.72fr)] lg:items-center lg:gap-8">
        <section className="rounded-[2rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))] px-5 py-6 shadow-[0_26px_80px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.08)] sm:rounded-[2.4rem] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-100/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.11),rgba(255,255,255,0.035))] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_12px_30px_rgba(0,0,0,0.32)] sm:h-14 sm:w-14">
              <Image
                src="/icon.png"
                alt="Logic League"
                width={56}
                height={56}
                className="h-9 w-9 object-contain drop-shadow-[0_0_12px_rgba(215,180,106,0.22)] sm:h-10 sm:w-10"
                priority
              />
            </div>
            <div className="min-w-0">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-league-gold sm:text-xs">Logic League</p>
              <p className="mt-1 text-xs font-bold text-league-silver/75 sm:text-sm">知的競技プラットフォーム</p>
            </div>
          </div>

          <div className="mt-7 max-w-3xl sm:mt-9">
            <h1 className="text-[2.65rem] font-black leading-[0.98] tracking-[-0.07em] text-white sm:text-6xl lg:text-7xl">
              知識ではなく、
              <br />
              思考で競え。
            </h1>
            <p className="mt-5 max-w-2xl text-[0.95rem] font-medium leading-7 text-league-silver sm:mt-6 sm:text-base sm:leading-8">
              課題解決型の問いに回答し、AI採点・議論・競技を通じて思考力の実績を蓄積する知的競技サービスです。
            </p>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 sm:mt-8 sm:flex sm:flex-wrap">
            <Link
              href="/exam"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-amber-100/55 bg-[linear-gradient(180deg,#f4d78d_0%,#c79a3d_100%)] px-6 py-3 text-sm font-black text-[#11100b] shadow-[0_14px_34px_rgba(199,154,61,0.22),inset_0_1px_0_rgba(255,255,255,0.62)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(199,154,61,0.28)] focus:outline-none focus:ring-2 focus:ring-amber-200/45"
            >
              認定試験を受ける
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/14 bg-white/[0.055] px-6 py-3 text-sm font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/[0.085] focus:outline-none focus:ring-2 focus:ring-amber-200/35"
            >
              ログイン
            </Link>
          </div>

          <p className="mt-5 max-w-2xl border-l border-amber-200/35 pl-3 text-xs font-medium leading-5 text-league-muted sm:text-[0.82rem]">
            本結果はAIによる推定であり、正式なIQ検査・心理検査ではありません。
          </p>
        </section>

        <section className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-[#080c14]/88 p-4 shadow-[0_22px_70px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.07)] sm:rounded-[2rem] sm:p-5 lg:p-6">
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/32 to-transparent" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-amber-200/[0.08] blur-2xl" aria-hidden="true" />

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black tracking-[0.24em] text-league-gold">認定試験</p>
              <h2 className="mt-2 text-xl font-black tracking-[-0.04em] text-white sm:text-2xl">思考力を5領域で測定</h2>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs font-black text-league-silver">100点</div>
          </div>

          <div className="mt-5 space-y-2.5">
            {examCriteria.map((item) => (
              <div key={item} className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
                <span className="text-sm font-bold text-league-silver sm:text-[0.95rem]">{item}</span>
                <span className="shrink-0 text-sm font-black tabular-nums text-league-gold">20点</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
