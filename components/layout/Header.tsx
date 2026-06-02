import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

export async function Header() {
  const data = { user: null as { email?: string | null } | null };
  if (hasSupabasePublicEnv()) {
    const supabase = await createClient();
    const response = await supabase.auth.getUser();
    data.user = response.data.user;
  }

  return (
    <header className="border-b border-white/10 bg-black/30 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-black tracking-[0.24em] text-league-gold">
          LOGIC LEAGUE
        </Link>
        <nav className="flex items-center gap-4 text-sm text-league-silver">
          <Link className="hover:text-white" href="/exam">Exam</Link>
          <Link className="hover:text-white" href="/home">Home</Link>
          {data.user ? <span className="hidden text-league-muted sm:inline">{data.user.email}</span> : <Link className="hover:text-white" href="/login">Login</Link>}
        </nav>
      </div>
    </header>
  );
}
