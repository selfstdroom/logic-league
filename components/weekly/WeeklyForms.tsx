"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

type MessageState = { type: "success" | "error"; text: string } | null;

function Message({ message }: { message: MessageState }) {
  if (!message) return null;
  return <p className={`mt-3 text-sm ${message.type === "success" ? "text-emerald-300" : "text-red-300"}`}>{message.text}</p>;
}

export function WeeklySubmissionForm({ topicId, canSubmit, initialContent = "" }: { topicId: string; canSubmit: boolean; initialContent?: string }) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [message, setMessage] = useState<MessageState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const response = await fetch(`/api/weekly/${topicId}/submission`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const result = await response.json().catch(() => null) as { error?: string } | null;
    setIsSubmitting(false);

    if (!response.ok) {
      setMessage({ type: "error", text: result?.error ?? "投稿に失敗しました。" });
      return;
    }

    setMessage({ type: "success", text: initialContent ? "投稿を更新しました。" : "投稿を保存しました。" });
    router.refresh();
  }

  if (!canSubmit) {
    return (
      <div className="rounded-3xl border border-white/10 bg-black/25 p-6 text-league-silver">
        <h2 className="text-xl font-black text-white">回答を投稿</h2>
        <p className="mt-3">Weekly Leagueの投稿は、受付期間中にログイン済みかつ認定済みのユーザーのみ利用できます。</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-amber-300/25 bg-[linear-gradient(145deg,rgba(215,180,106,0.12),rgba(0,0,0,0.34))] p-6 shadow-2xl">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">公式エントリー</p>
      <h2 className="mt-2 text-2xl font-black">回答を投稿</h2>
      <p className="mt-2 text-sm leading-6 text-league-muted">各Weekly League Topicにつき投稿は1件です。投稿締切までは編集できます。</p>
      <label className="mt-5 block text-sm font-bold text-league-silver">
        回答
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          minLength={10}
          required
          rows={10}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white placeholder:text-league-muted"
          placeholder="立場、論理、トレードオフ、最も強い反論を明確に書いてください。"
        />
      </label>
      <Button className="mt-4" disabled={isSubmitting}>{isSubmitting ? "保存中..." : initialContent ? "投稿を更新" : "回答を投稿"}</Button>
      <Message message={message} />
    </form>
  );
}

export function WeeklyVoteButton({ topicId, answerId, canVote, voted }: { topicId: string; answerId: string; canVote: boolean; voted: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<MessageState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function vote() {
    setIsSubmitting(true);
    setMessage(null);
    const response = await fetch(`/api/weekly/${topicId}/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer_id: answerId }),
    });
    const result = await response.json().catch(() => null) as { error?: string } | null;
    setIsSubmitting(false);

    if (!response.ok) {
      setMessage({ type: "error", text: result?.error ?? "投票に失敗しました。" });
      return;
    }

    setMessage({ type: "success", text: "投票を記録しました。" });
    router.refresh();
  }

  return (
    <div>
      <Button onClick={vote} disabled={!canVote || voted || isSubmitting} className={voted ? "bg-none bg-emerald-300/15 text-emerald-200 shadow-none ring-1 ring-emerald-300/30" : ""}>
        {voted ? "投票済み" : isSubmitting ? "投票中..." : "投票"}
      </Button>
      <Message message={message} />
    </div>
  );
}
