import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const body = await request.json().catch(() => null) as { content?: unknown } | null;
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (content.length < 2) return NextResponse.json({ error: "コメントは2文字以上で入力してください。" }, { status: 400 });

  const { data: answer, error: answerError } = await supabase
    .from("topic_answers")
    .select("id, topics!inner(type, status)")
    .eq("id", id)
    .eq("topics.type", "daily")
    .eq("topics.status", "published")
    .maybeSingle();
  if (answerError) return NextResponse.json({ error: answerError.message }, { status: 500 });
  if (!answer) return NextResponse.json({ error: "回答が見つかりません。" }, { status: 404 });

  const { error } = await supabase.from("comments").insert({ topic_answer_id: id, user_id: user.id, content });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
