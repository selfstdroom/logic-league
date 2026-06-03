import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const { data: answer, error: answerError } = await supabase
    .from("topic_answers")
    .select("id, topics!inner(type, status)")
    .eq("id", id)
    .eq("topics.type", "daily")
    .eq("topics.status", "published")
    .maybeSingle();
  if (answerError) return NextResponse.json({ error: answerError.message }, { status: 500 });
  if (!answer) return NextResponse.json({ error: "回答が見つかりません。" }, { status: 404 });

  const { data: existing, error: existingError } = await supabase
    .from("likes")
    .select("id")
    .eq("topic_answer_id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });

  if (existing) {
    const { error } = await supabase.from("likes").delete().eq("id", existing.id).eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ liked: false });
  }

  const { error } = await supabase.from("likes").insert({ topic_answer_id: id, user_id: user.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ liked: true });
}
