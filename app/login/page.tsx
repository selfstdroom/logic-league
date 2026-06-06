import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PremiumBadge } from "@/components/ui/DesignSystem";
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
    <main className="mx-auto flex min-h-[76vh] max-w-xl items-center px-5 py-12 sm:px-6">
      <Card className="w-full border-amber-300/20 p-6 sm:p-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-amber-300/20 bg-black/25 shadow-[0_22px_70px_rgba(0,0,0,0.35),0_0_42px_rgba(215,180,106,0.16)] sm:h-28 sm:w-28">
            <Image
              src="/logo.png"
              alt="Logic League"
              width={88}
              height={88}
              className="h-20 w-20 object-contain sm:h-24 sm:w-24"
              priority
            />
          </div>
          <PremiumBadge tone="gold">思考のリーグ</PremiumBadge>
          <p className="mt-4 text-base font-black tracking-[0.08em] text-league-gold sm:text-lg">知識ではなく、思考で競え</p>
          <h1 className="mt-6 text-3xl font-black">ログイン</h1>
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
              className="premium-input mt-2"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-league-silver">パスワード</span>
            <input
              className="premium-input mt-2"
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
          <Link className="font-bold text-league-gold hover:text-white" href="/signup">新規登録</Link>
        </p>
      </Card>
    </main>
  );
}
