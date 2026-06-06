import Image from "next/image";

type BrandedLoadingProps = {
  label?: string;
};

export function BrandedLoading({ label = "読み込み中" }: BrandedLoadingProps) {
  return (
    <div className="flex min-h-[42vh] items-center justify-center px-5 py-12" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-[1.7rem] border border-amber-300/20 bg-black/30 shadow-[0_18px_60px_rgba(0,0,0,0.35),0_0_34px_rgba(215,180,106,0.14)]">
          <div className="absolute inset-0 rounded-[1.7rem] bg-[radial-gradient(circle,rgba(215,180,106,0.16),transparent_68%)] animate-[brandFade_2.4s_ease-in-out_infinite]" />
          <Image
            src="/logo.png"
            alt="Logic League"
            width={56}
            height={56}
            className="relative h-14 w-14 object-contain animate-[brandFade_2.4s_ease-in-out_infinite]"
            priority
          />
        </div>
        <p className="text-sm font-bold tracking-[0.08em] text-league-silver">{label}</p>
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}
