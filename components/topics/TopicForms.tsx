"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatAnswerType } from "@/lib/topics/format";
import type { TopicAnswerType } from "@/types/database";

const answerTypes: TopicAnswerType[] = ["Answer", "Counter", "Support", "Question"];

type MessageState = { type: "success" | "error"; text: string } | null;

function Message({ message }: { message: MessageState }) {
  if (!message) return null;

  const color = message.type === "success" ? "text-emerald-300" : "text-red-300";
  return <p className={`mt-3 text-sm ${color}`}>{message.text}</p>;
}

export function AnswerForm({ topicId, canAnswer }: { topicId: string; canAnswer: boolean }) {
  const router = useRouter();
  const [answerType, setAnswerType] = useState<TopicAnswerType>("Answer");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<MessageState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const response = await fetch(`/api/topics/${topicId}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer_type: answerType, content }),
    });
    const result = await response.json().catch(() => null) as { error?: string } | null;

    setIsSubmitting(false);
    if (!response.ok) {
      setMessage({ type: "error", text: result?.error ?? "回答の投稿に失敗しました。" });
      return;
    }

    setContent("");
    setAnswerType("Answer");
    setMessage({ type: "success", text: "回答を投稿しました。" });
    router.refresh();
  }

  if (!canAnswer) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-league-silver">
        <h2 className="text-xl font-bold text-white">ログインすると議論に参加できます</h2>
        <p className="mt-3">Daily Topicsへの回答は、ログイン済みかつ認定試験に合格したユーザーのみ投稿できます。</p>
        <a href="/login" className="mt-5 inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-5 py-3 text-sm font-black text-league-gold transition hover:bg-amber-300/20 hover:text-white">ログインする</a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-amber-300/20 bg-[radial-gradient(circle_at_top_right,rgba(215,180,106,0.12),transparent_30%),linear-gradient(145deg,rgba(255,255,255,0.06),rgba(8,13,26,0.72))] p-6 shadow-2xl">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-league-gold">議論に参加</p>
      <h2 className="mt-2 text-2xl font-black">回答を投稿する</h2>
      <div className="mt-4 grid gap-4">
        <label className="text-sm font-bold text-league-silver">
          種類
          <select
            value={answerType}
            onChange={(event) => setAnswerType(event.target.value as TopicAnswerType)}
            className="premium-input mt-2"
          >
            {answerTypes.map((type) => <option key={type} value={type}>{formatAnswerType(type)}</option>)}
          </select>
        </label>
        <label className="text-sm font-bold text-league-silver">
          本文
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            minLength={10}
            required
            rows={6}
            className="premium-textarea mt-2"
            placeholder="論点、根拠、反論可能性を明確に書いてください。"
          />
        </label>
      </div>
      <Button className="mt-4" disabled={isSubmitting}>{isSubmitting ? "投稿中..." : "回答を投稿する"}</Button>
      <Message message={message} />
    </form>
  );
}

export function CommentForm({ answerId, canComment }: { answerId: string; canComment: boolean }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<MessageState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const response = await fetch(`/api/topic-answers/${answerId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const result = await response.json().catch(() => null) as { error?: string } | null;

    setIsSubmitting(false);
    if (!response.ok) {
      setMessage({ type: "error", text: result?.error ?? "コメントの投稿に失敗しました。" });
      return;
    }

    setContent("");
    setMessage({ type: "success", text: "コメントを投稿しました。" });
    router.refresh();
  }

  if (!canComment) {
    return (
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-bold text-white">ログインすると議論に参加できます</p>
        <a href="/login" className="mt-3 inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-xs font-black text-league-gold transition hover:bg-amber-300/20 hover:text-white">ログインする</a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
      <input
        value={content}
        onChange={(event) => setContent(event.target.value)}
        required
        minLength={2}
        className="min-w-0 flex-1 rounded-full border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-league-muted focus:border-amber-300/50 focus:ring-2 focus:ring-amber-300/20"
        placeholder="コメントを書く"
      />
      <Button disabled={isSubmitting} className="px-5 py-2 shadow-none">コメントする</Button>
      <Message message={message} />
    </form>
  );
}

export function LikeButton({ answerId, likeCount, liked, canLike }: { answerId: string; likeCount: number; liked: boolean; canLike: boolean }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);

  async function toggleLike() {
    setIsSubmitting(true);
    setMessage(null);
    const response = await fetch(`/api/topic-answers/${answerId}/like`, { method: "POST" });
    const result = await response.json().catch(() => null) as { error?: string } | null;
    setIsSubmitting(false);

    if (!response.ok) {
      setMessage({ type: "error", text: result?.error ?? "いいねの更新に失敗しました。" });
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggleLike}
        disabled={!canLike || isSubmitting}
        className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-league-silver transition hover:border-amber-300/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {liked ? "取り消す" : "いいね"} · {likeCount}
      </button>
      {!canLike ? <a href="/login" className="ml-3 text-xs font-bold text-league-gold hover:text-white">ログインすると議論に参加できます</a> : null}
      <Message message={message} />
    </div>
  );
}
