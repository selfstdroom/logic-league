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
    <header className="border-b border-white/10 bg-black/30 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-lg font-black tracking-[0.24em] text-league-gold">
          LOGIC LEAGUE
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-league-silver">
          <Link className="hover:text-white" href="/home">Home</Link>
          <Link className="hover:text-white" href="/topics">Topics</Link>
          <Link className="hover:text-white" href={data.username ? `/profile/${data.username}` : "/profile"}>Profile</Link>
          <Link className="hover:text-white" href="/exam">Exam</Link>
          {data.user ? <span className="hidden text-league-muted md:inline">{data.user.email}</span> : <Link className="hover:text-white" href="/login">Login</Link>}
        </nav>
      </div>
    </header>
  );
}
