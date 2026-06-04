import { NextResponse } from "next/server";
import { evaluateAchievements } from "@/lib/achievements";
import { createClient } from "@/lib/supabase/server";
import type { DebateReplyType } from "@/types/database";

const replyTypes = new Set<DebateReplyType>(["counter", "rebuttal", "support", "question"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const body = await request.json().catch(() => null) as { content?: unknown; reply_type?: unknown; parent_reply_id?: unknown } | null;
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const replyType = typeof body?.reply_type === "string" && replyTypes.has(body.reply_type as DebateReplyType)
    ? body.reply_type as DebateReplyType
    : "support";
  const parentReplyId = typeof body?.parent_reply_id === "string" && body.parent_reply_id.length > 0 ? body.parent_reply_id : null;

  if (content.length < 2) return NextResponse.json({ error: "投稿は2文字以上で入力してください。" }, { status: 400 });

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

  if (parentReplyId) {
    const { data: parentReply, error: parentReplyError } = await supabase
      .from("comments")
      .select("id, topic_answer_id")
      .eq("id", parentReplyId)
      .eq("topic_answer_id", id)
      .maybeSingle();
    if (parentReplyError) return NextResponse.json({ error: parentReplyError.message }, { status: 500 });
    if (!parentReply) return NextResponse.json({ error: "返信先が見つかりません。" }, { status: 404 });
  }

  const { error } = await supabase.from("comments").insert({
    topic_answer_id: id,
    parent_reply_id: parentReplyId,
    user_id: user.id,
    reply_type: replyType,
    content,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let unlockedAchievements: Awaited<ReturnType<typeof evaluateAchievements>> = [];
  try {
    unlockedAchievements = await evaluateAchievements(user.id);
  } catch (achievementError) {
    console.warn("Achievement evaluation skipped after debate reply.", achievementError);
  }
  return NextResponse.json({ ok: true, unlockedAchievements });
}
