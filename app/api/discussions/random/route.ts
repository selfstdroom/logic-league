import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topics")
    .select("id, type")
    .eq("status", "published")
    .filter("type", "in", "(daily,weekly,special)")
    .limit(100);

  const topics = data ?? [];
  if (topics.length === 0) return NextResponse.redirect(new URL("/topics", request.url));

  const topic = topics[Math.floor(Math.random() * topics.length)];
  const path = topic.type === "weekly" ? `/weekly/${topic.id}` : `/topics/${topic.id}`;
  return NextResponse.redirect(new URL(path, request.url));
}
