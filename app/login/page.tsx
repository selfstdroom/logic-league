import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function redirectWithError(message: string) {
  redirect(`/login?error=${encodeURIComponent(message)}`);
}

async function loginWithEmail(formData: FormData) {
  "use server";

  const email = getFormString(formData, "email");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirectWithError("メールアドレスとパスワードを入力してください。");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirectWithError("メールアドレスまたはパスワードが正しくありません。");
  }

  redirect("/home");
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const { error, message } = await searchParams;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-6 py-16">
      <Card className="w-full p-8">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-league-gold">Sign in</p>
          <h1 className="mt-4 text-3xl font-black">ログイン</h1>
          <p className="mt-4 text-league-silver">メールアドレスとパスワードでログインしてください。</p>
        </div>
        {message ? (
          <p className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">{message}</p>
        ) : null}
        {error ? (
          <p className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">{error}</p>
        ) : null}
        <form action={loginWithEmail} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-bold text-league-silver">メールアドレス</span>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-league-gold"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-league-silver">パスワード</span>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-league-gold"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <Button type="submit" className="w-full">ログイン</Button>
        </form>
        <p className="mt-6 text-center text-sm text-league-silver">
          アカウントをお持ちでない場合は{" "}
          <Link className="font-bold text-league-gold hover:text-white" href="/signup">アカウントを作成</Link>
        </p>
      </Card>
    </main>
  );
}
