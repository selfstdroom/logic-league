import Link from "next/link";
import { CollectionRoom } from "@/components/profile/CollectionRoom";
import { Card } from "@/components/ui/Card";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/logic-league";

export const dynamic = "force-dynamic";

function normalizeProfileUsername(username: string) {
  return decodeURIComponent(username).trim().toLowerCase();
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function CollectionNotFound({ username }: { username: string }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
      <Card className="border-amber-300/25 bg-[radial-gradient(circle_at_top_right,rgba(215,180,106,0.12),transparent_34%),rgba(255,255,255,0.035)] text-center">
        <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">Collection not found</p>
        <h1 className="mt-4 text-3xl font-black text-white">コレクションルームが見つかりませんでした。</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-league-silver">
          @{username} の公開プロフィールは存在しないか、ユーザー名が変更されています。
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/search" className="rounded-full border border-amber-300/30 bg-amber-300/10 px-5 py-3 text-sm font-black text-league-gold transition hover:bg-amber-300/20 hover:text-white">検索へ戻る</Link>
          <Link href="/profile" className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.1]">マイページへ</Link>
        </div>
      </Card>
    </main>
  );
}

export default async function PublicCollectionPage({ params }: { params: Promise<{ username: string }> }) {
  const { username: rawUsername } = await params;
  const username = normalizeProfileUsername(rawUsername);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const readClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;

  let profile: Profile | null = null;
  const byUsername = await readClient.from("profiles").select("*").eq("username", username).maybeSingle();
  profile = byUsername.data as Profile | null;

  if (!profile && isUuid(username)) {
    const byId = await readClient.from("profiles").select("*").eq("id", username).maybeSingle();
    profile = byId.data as Profile | null;
  }

  if (!profile) return <CollectionNotFound username={username || rawUsername} />;

  return <CollectionRoom profile={profile} viewerId={user?.id ?? ""} />;
}
