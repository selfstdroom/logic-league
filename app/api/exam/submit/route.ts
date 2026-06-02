import { NextResponse } from "next/server";
import { gradeExamAnswer } from "@/lib/openai";
import { buildExamResult, MIN_EXAM_ANSWER_LENGTH } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/server";

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
