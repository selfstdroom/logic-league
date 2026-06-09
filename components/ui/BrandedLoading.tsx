import Image from "next/image";

const loadingTips = ["思考フィードを読み込み中", "議論を準備しています", "今日の問いを読み込んでいます"];

type BrandedLoadingProps = {
  label?: string;
  tip?: string;
};

export function BrandedLoading({ label = "思考フィードを読み込み中", tip = "回答・反論・補足を整理しています。" }: BrandedLoadingProps) {
  return (
    <div className="flex min-h-[58vh] items-center justify-center px-4 py-8" role="status" aria-live="polite">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-amber-300/18 bg-[radial-gradient(circle_at_top,rgba(215,180,106,0.18),transparent_42%),linear-gradient(145deg,rgba(255,255,255,0.075),rgba(7,12,23,0.86))] p-6 text-center shadow-[0_28px_95px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-8">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/80 to-transparent" />
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-white/10 bg-black/25 shadow-[0_0_42px_rgba(215,180,106,0.16)]">
          <Image src="/logo.png" alt="Logic League" width={72} height={72} className="h-16 w-16 rounded-[1.2rem] object-cover animate-[brandFade_2.4s_ease-in-out_infinite]" priority />
        </div>
        <p className="mt-5 text-[0.68rem] font-black uppercase tracking-[0.28em] text-league-gold">Logic League</p>
        <h1 className="mt-2 text-xl font-black text-white">{label}</h1>
        <p className="mt-3 text-sm font-bold leading-6 text-league-silver">{tip}</p>
        <div className="mt-6 grid grid-cols-3 gap-2" aria-hidden="true">
          {loadingTips.map((item, index) => (
            <div key={item} className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-league-gold via-amber-100 to-white animate-[loadingShimmer_1.6s_ease-in-out_infinite]" style={{ animationDelay: `${index * 160}ms` }} />
            </div>
          ))}
        </div>
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}
