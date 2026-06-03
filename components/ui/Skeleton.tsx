export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
      <div className="h-4 w-28 animate-pulse rounded-full bg-white/10" />
      <div className="mt-5 h-8 w-3/4 animate-pulse rounded-full bg-white/10" />
      <div className="mt-4 space-y-3">
        <div className="h-3 animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-5/6 animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/10" />
      </div>
    </div>
  );
}
