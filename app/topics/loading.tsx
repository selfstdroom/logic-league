import { SkeletonCard } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:py-12">
      <div className="mb-8 h-64 animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.04]" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </main>
  );
}
