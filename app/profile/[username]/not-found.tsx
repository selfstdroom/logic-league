import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function ProfileNotFoundPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
      <Card className="border-amber-300/25 text-center">
        <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">Profile not found</p>
        <h1 className="mt-4 text-3xl font-black text-white">ユーザーが見つかりませんでした。</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-league-silver">公開プロフィールが存在しないか、ユーザー名が変更されています。</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/search" className="rounded-full border border-amber-300/30 bg-amber-300/10 px-5 py-3 text-sm font-black text-league-gold transition hover:bg-amber-300/20 hover:text-white">検索へ戻る</Link>
          <Link href="/profile" className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.1]">マイページへ</Link>
        </div>
      </Card>
    </main>
  );
}
