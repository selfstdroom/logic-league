import { NextResponse } from "next/server";
import { evaluateAchievements } from "@/lib/achievements";
import { createClient } from "@/lib/supabase/server";
import type { TopicAnswerType } from "@/types/database";

const answerTypes = new Set<TopicAnswerType>(["Answer", "Counter", "Support", "Question"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const body = await request.json().catch(() => null) as { answer_type?: unknown; content?: unknown } | null;
  const answerType = typeof body?.answer_type === "string" && answerTypes.has(body.answer_type as TopicAnswerType)
    ? body.answer_type as TopicAnswerType
    : null;
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!answerType) return NextResponse.json({ error: "回答タイプを選択してください。" }, { status: 400 });
  if (content.length < 10) return NextResponse.json({ error: "回答は10文字以上で入力してください。" }, { status: 400 });

  const { data: profile, error: profileError } = await supabase.from("profiles").select("qualified").eq("id", user.id).maybeSingle();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  if (!profile?.qualified) return NextResponse.json({ error: "回答には認定試験の合格が必要です。" }, { status: 403 });

  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("id")
    .eq("id", id)
    .eq("type", "daily")
    .eq("status", "published")
    .maybeSingle();
  if (topicError) return NextResponse.json({ error: topicError.message }, { status: 500 });
  if (!topic) return NextResponse.json({ error: "トピックが見つかりません。" }, { status: 404 });

  const { error } = await supabase.from("topic_answers").insert({
    topic_id: id,
    user_id: user.id,
    answer_type: answerType,
    content,
    is_anonymous: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let unlockedAchievements: Awaited<ReturnType<typeof evaluateAchievements>> = [];
  try {
    unlockedAchievements = await evaluateAchievements(user.id);
  } catch (achievementError) {
    console.warn("Achievement evaluation skipped after answer.", achievementError);
  }
  return NextResponse.json({ ok: true, unlockedAchievements });
}
