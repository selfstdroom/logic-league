"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

const secondaryButtonClass = "inline-flex items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10 px-5 py-2.5 text-sm font-bold text-league-gold transition hover:bg-amber-300/20 hover:text-white";

type MessageState = { type: "success" | "error"; text: string } | null;

type SubmissionBlockReason = "visitor" | "unqualified" | "closed";

type VoteBlockReason = "visitor" | "unqualified" | "no_votes" | "own_answer" | "closed";

function Message({ message }: { message: MessageState }) {
  if (!message) return null;
  return <p className={`mt-3 text-sm ${message.type === "success" ? "text-emerald-300" : "text-red-300"}`}>{message.text}</p>;
}

export function WeeklySubmissionForm({
  topicId,
  canSubmit,
  initialContent = "",
  blockReason,
}: {
  topicId: string;
  canSubmit: boolean;
  initialContent?: string;
  blockReason: SubmissionBlockReason;
}) {
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
        {blockReason === "visitor" ? (
          <>
            <p className="mt-3">ログインするとWeekly Leagueへの参加資格を確認できます。</p>
            <Link href="/login" className={`${secondaryButtonClass} mt-5`}>ログインする</Link>
          </>
        ) : blockReason === "unqualified" ? (
          <>
            <p className="mt-3">認定試験に合格するとWeekly Leagueに参加できます</p>
            <Link href="/exam" className={`${secondaryButtonClass} mt-5`}>認定試験を受ける</Link>
          </>
        ) : (
          <p className="mt-3">このWeekly League Topicの回答受付は終了しています。</p>
        )}
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

export function WeeklyVoteButton({
  topicId,
  answerId,
  canVote,
  voted,
  blockReason,
}: {
  topicId: string;
  answerId: string;
  canVote: boolean;
  voted: boolean;
  blockReason: VoteBlockReason | null;
}) {
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

  const helperText = blockReason === "visitor" || blockReason === "unqualified"
    ? "ログインまたは認定試験合格後に投票できます"
    : blockReason === "no_votes"
      ? "このTopicで使える3票はすべて使用済みです。"
      : blockReason === "own_answer"
        ? "自分の回答には投票できません。"
        : blockReason === "closed"
          ? "投票受付は終了しています。"
          : null;

  return (
    <div className="max-w-xs text-right">
      <Button onClick={vote} disabled={!canVote || voted || isSubmitting} className={voted ? "bg-none bg-emerald-300/15 text-emerald-200 shadow-none ring-1 ring-emerald-300/30" : ""}>
        {voted ? "投票済み" : isSubmitting ? "投票中..." : "投票"}
      </Button>
      {helperText ? <p className="mt-2 text-xs leading-5 text-league-muted">{helperText}</p> : null}
      <Message message={message} />
    </div>
  );
}
