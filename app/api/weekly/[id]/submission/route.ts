import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { scoreWeeklyAnswer } from "@/lib/weeklyScoring";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "Login is required." }, { status: 401 });

  const body = await request.json().catch(() => null) as { content?: unknown } | null;
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (content.length < 10) return NextResponse.json({ error: "Answer must be at least 10 characters." }, { status: 400 });

  const { data: profile, error: profileError } = await supabase.from("profiles").select("qualified").eq("id", user.id).maybeSingle();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  if (!profile?.qualified) return NextResponse.json({ error: "Weekly League requires qualification." }, { status: 403 });

  const admin = createAdminClient();
  const { data: topic, error: topicError } = await admin
    .from("topics")
    .select("id, deadline_at")
    .eq("id", id)
    .eq("type", "weekly")
    .eq("status", "published")
    .maybeSingle();
  if (topicError) return NextResponse.json({ error: topicError.message }, { status: 500 });
  if (!topic) return NextResponse.json({ error: "Weekly topic not found." }, { status: 404 });
  if (!topic.deadline_at || new Date(topic.deadline_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: "Submission deadline has passed." }, { status: 403 });
  }

  const scores = scoreWeeklyAnswer(content);
  const { data: existing, error: existingError } = await admin
    .from("topic_answers")
    .select("id")
    .eq("topic_id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });

  const payload = {
    topic_id: id,
    user_id: user.id,
    answer_type: "Answer" as const,
    content,
    is_anonymous: true,
    final_score: null,
    ranking_position: null,
    ...scores,
  };

  const { error } = existing
    ? await admin.from("topic_answers").update(payload).eq("id", existing.id)
    : await admin.from("topic_answers").insert(payload);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
