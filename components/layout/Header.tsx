import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

export async function Header() {
  const data = { user: null as { id: string; email?: string | null } | null, username: null as string | null };
  if (hasSupabasePublicEnv()) {
    const supabase = await createClient();
    const response = await supabase.auth.getUser();
    data.user = response.data.user;
    if (data.user) {
      const { data: profile } = await supabase.from("profiles").select("username").eq("id", data.user.id).maybeSingle();
      data.username = profile?.username ?? null;
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/55 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="group inline-flex items-center gap-3 text-lg font-black tracking-[0.24em] text-league-gold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-300/35 bg-amber-300/10 text-sm shadow-[0_0_30px_rgba(215,180,106,0.18)]">LL</span>
          <span className="transition group-hover:text-white">LOGIC LEAGUE</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm text-league-silver sm:justify-end">
          <Link className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white" href="/home">Home</Link>
          <Link className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white" href="/topics">Topics</Link>
          <Link className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white" href={data.username ? `/profile/${data.username}` : "/profile"}>Profile</Link>
          <Link className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white" href="/exam">Exam</Link>
          {data.user ? <span className="hidden max-w-48 truncate rounded-full border border-white/10 px-3 py-2 text-league-muted md:inline">{data.user.email}</span> : <Link className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 font-bold text-league-gold transition hover:bg-amber-300/20" href="/login">Login</Link>}
        </nav>
      </div>
    </header>
  );
}
