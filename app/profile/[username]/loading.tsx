import { SkeletonCard } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:py-12">
      <SkeletonCard />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </main>
  );
}
