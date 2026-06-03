import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function redirectWithError(message: string) {
  redirect(`/signup?error=${encodeURIComponent(message)}`);
}

async function signupWithEmail(formData: FormData) {
  "use server";

  const email = getFormString(formData, "email");
  const password = String(formData.get("password") ?? "");
  const passwordConfirmation = String(formData.get("password_confirmation") ?? "");
  const username = getFormString(formData, "username").toLowerCase();
  const displayName = getFormString(formData, "display_name");

  if (!email || !password || !passwordConfirmation || !username || !displayName) {
    redirectWithError("すべての項目を入力してください。");
  }

  if (password.length < 6) {
    redirectWithError("パスワードは6文字以上で入力してください。");
  }

  if (password !== passwordConfirmation) {
    redirectWithError("パスワード確認が一致しません。");
  }

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    redirectWithError("ユーザー名は3〜20文字の半角英数字とアンダースコアで入力してください。");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: displayName,
      },
    },
  });

  if (error) {
    redirectWithError(error.message);
  }

  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email,
      username,
      display_name: displayName,
    }, { onConflict: "id" });
  }

  if (data.session) {
    redirect("/home");
  }

  redirect(`/login?message=${encodeURIComponent("登録が完了しました。メール確認が必要な場合は確認後にログインしてください。")}`);
}

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-6 py-16">
      <Card className="w-full p-8">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-league-gold">新規登録</p>
          <h1 className="mt-4 text-3xl font-black">新規登録</h1>
          <p className="mt-4 text-league-silver">Supabase Authのメールアドレス・パスワード認証で登録します。</p>
        </div>
        {error ? (
          <p className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">{error}</p>
        ) : null}
        <form action={signupWithEmail} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-bold text-league-silver">メールアドレス</span>
            <input className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-league-gold" name="email" type="email" autoComplete="email" required />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-league-silver">パスワード</span>
            <input className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-league-gold" name="password" type="password" autoComplete="new-password" minLength={6} required />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-league-silver">パスワード確認</span>
            <input className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-league-gold" name="password_confirmation" type="password" autoComplete="new-password" minLength={6} required />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-league-silver">ユーザー名</span>
            <input className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-league-gold" name="username" type="text" autoComplete="username" minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+" required />
            <span className="mt-2 block text-xs text-league-muted">3〜20文字の半角英数字とアンダースコア</span>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-league-silver">表示名</span>
            <input className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-league-gold" name="display_name" type="text" autoComplete="name" required />
          </label>
          <Button type="submit" className="w-full">新規登録</Button>
        </form>
        <p className="mt-6 text-center text-sm text-league-silver">
          すでにアカウントを持っている場合は{" "}
          <Link className="font-bold text-league-gold hover:text-white" href="/login">ログイン</Link>
        </p>
      </Card>
    </main>
  );
}
