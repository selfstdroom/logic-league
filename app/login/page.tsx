import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

async function loginWithGoogle() {
  "use server";
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error) throw new Error(error.message);
  if (data.url) redirect(data.url);
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-6 py-16">
      <Card className="w-full p-8 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-league-gold">Sign in</p>
        <h1 className="mt-4 text-3xl font-black">Googleログイン</h1>
        <p className="mt-4 text-league-silver">Supabase AuthのGoogle OAuthでログインし、プロフィールを自動作成します。</p>
        <form action={loginWithGoogle} className="mt-8">
          <Button type="submit" className="w-full">Googleで続ける</Button>
        </form>
      </Card>
    </main>
  );
}
