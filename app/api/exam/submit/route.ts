import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { gradeExamAnswer } from "@/lib/openai";
import { buildExamResult, MIN_EXAM_ANSWER_LENGTH } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function getEmailPrefix(email?: string) {
  return email?.split("@")[0]?.trim() || "Logic Player";
}

function buildFallbackUsername(email?: string) {
  const prefix = getEmailPrefix(email).toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "") || "user";
  const randomDigits = Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0");

  return `${prefix}${randomDigits}`;
}

async function ensureProfile(supabase: SupabaseClient, user: User) {
  const { data: profile, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (profile) return;

  const emailPrefix = getEmailPrefix(user.email);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email ?? null,
      username: buildFallbackUsername(user.email),
      display_name: emailPrefix,
      qualified: false,
      rating: 0,
      rank: "Visitor",
    });

    if (!insertError) return;

    if (insertError.code !== "23505") throw insertError;

    const { data: existingProfile, error: existingProfileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (existingProfileError) throw existingProfileError;
    if (existingProfile) return;
  }

  throw new Error("プロフィールの自動作成に失敗しました。もう一度お試しください。");
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const body = await request.json().catch(() => null) as { answer?: unknown } | null;
  const answer = typeof body?.answer === "string" ? body.answer.trim() : "";

  if (answer.length < MIN_EXAM_ANSWER_LENGTH) {
    return NextResponse.json({ error: "回答は500文字以上で入力してください。" }, { status: 400 });
  }

  try {
    await ensureProfile(supabase, user);

    const evaluation = await gradeExamAnswer(answer);
    const result = buildExamResult(evaluation);

    const { error: insertError } = await supabase.from("exam_answers").insert({
      user_id: user.id,
      answer,
      ...result,
    });
    if (insertError) throw insertError;

    const { error: profileError } = await supabase.from("profiles").update({
      predicted_deviation: result.predicted_deviation,
      qualified: result.qualified,
      rating: result.rating,
      rank: result.rank,
      archetype: result.archetype,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (profileError) throw profileError;

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI採点に失敗しました。" }, { status: 500 });
  }
}
