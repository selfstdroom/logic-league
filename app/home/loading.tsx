import { SkeletonCard } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:py-12">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </main>
  );
}
