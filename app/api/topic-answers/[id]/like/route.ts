import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase.from("profiles").select("qualified").eq("id", user.id).maybeSingle();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  if (!profile?.qualified) return NextResponse.json({ error: "認定試験に合格すると議論に参加できます" }, { status: 403 });

  const { data: answer, error: answerError } = await supabase
    .from("topic_answers")
    .select("id, topics!inner(type, status, reveal_at)")
    .eq("id", id)
    .eq("topics.status", "published")
    .maybeSingle();
  if (answerError) return NextResponse.json({ error: answerError.message }, { status: 500 });
  if (!answer) return NextResponse.json({ error: "回答が見つかりません。" }, { status: 404 });

  const answerTopic = answer as { topics?: { type?: string | null; reveal_at?: string | null } | { type?: string | null; reveal_at?: string | null }[] | null };
  const topic = Array.isArray(answerTopic.topics) ? answerTopic.topics[0] : answerTopic.topics;
  if (topic?.type === "weekly" && (!topic.reveal_at || topic.reveal_at > new Date().toISOString())) {
    return NextResponse.json({ error: "結果公開後に参加できます。" }, { status: 403 });
  }

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
