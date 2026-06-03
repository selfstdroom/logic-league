import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "Login is required." }, { status: 401 });

  const body = await request.json().catch(() => null) as { answer_id?: unknown } | null;
  const answerId = typeof body?.answer_id === "string" ? body.answer_id : "";
  if (!answerId) return NextResponse.json({ error: "Answer is required." }, { status: 400 });

  const { data: profile, error: profileError } = await supabase.from("profiles").select("qualified").eq("id", user.id).maybeSingle();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  if (!profile?.qualified) return NextResponse.json({ error: "Voting requires qualification." }, { status: 403 });

  const admin = createAdminClient();
  const { data: topic, error: topicError } = await admin
    .from("topics")
    .select("id, deadline_at, vote_deadline_at")
    .eq("id", id)
    .eq("type", "weekly")
    .eq("status", "published")
    .maybeSingle();
  if (topicError) return NextResponse.json({ error: topicError.message }, { status: 500 });
  if (!topic) return NextResponse.json({ error: "Weekly topic not found." }, { status: 404 });
  const now = Date.now();
  if (!topic.deadline_at || new Date(topic.deadline_at).getTime() > now) return NextResponse.json({ error: "Voting has not opened yet." }, { status: 403 });
  if (!topic.vote_deadline_at || new Date(topic.vote_deadline_at).getTime() <= now) return NextResponse.json({ error: "Voting is closed." }, { status: 403 });

  const { data: answer, error: answerError } = await admin
    .from("topic_answers")
    .select("id, user_id, vote_count")
    .eq("id", answerId)
    .eq("topic_id", id)
    .maybeSingle();
  if (answerError) return NextResponse.json({ error: answerError.message }, { status: 500 });
  if (!answer) return NextResponse.json({ error: "Answer not found." }, { status: 404 });
  if (answer.user_id === user.id) return NextResponse.json({ error: "You cannot vote for your own answer." }, { status: 403 });

  const [{ count: usedVotes }, { data: existingVote }] = await Promise.all([
    admin.from("weekly_votes").select("id", { count: "exact", head: true }).eq("topic_id", id).eq("user_id", user.id),
    admin.from("weekly_votes").select("id").eq("topic_answer_id", answerId).eq("user_id", user.id).maybeSingle(),
  ]);

  if (existingVote) return NextResponse.json({ error: "You already voted for this answer." }, { status: 409 });
  if ((usedVotes ?? 0) >= 3) return NextResponse.json({ error: "You have used all 3 votes for this topic." }, { status: 403 });

  const { error: voteError } = await admin.from("weekly_votes").insert({ topic_id: id, topic_answer_id: answerId, user_id: user.id });
  if (voteError) return NextResponse.json({ error: voteError.message }, { status: 500 });

  const { error: countError } = await admin.from("topic_answers").update({ vote_count: (answer.vote_count ?? 0) + 1 }).eq("id", answerId);
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
