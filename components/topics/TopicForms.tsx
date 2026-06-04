"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatAnswerType, formatReplyType } from "@/lib/topics/format";
import type { DebateReplyType, TopicAnswerType } from "@/types/database";

const answerTypes: TopicAnswerType[] = ["Answer", "Counter", "Support", "Question"];
const debateReplyTypes: DebateReplyType[] = ["counter", "rebuttal", "support", "question"];

type MessageState = { type: "success" | "error"; text: string } | null;
type UnlockedAchievement = { key: string; title: string; badgeIcon: string };

function AchievementNotice({ achievements }: { achievements: UnlockedAchievement[] }) {
  if (achievements.length === 0) return null;
  return (
    <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-league-silver shadow-glow">
      <p className="font-black text-league-gold">新しい実績を獲得しました</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {achievements.map((achievement) => (
          <span key={achievement.key} className="rounded-full border border-white/10 bg-black/25 px-3 py-1 font-bold text-white">{achievement.badgeIcon} {achievement.title}</span>
        ))}
      </div>
    </div>
  );
}

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
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setUnlockedAchievements([]);

    const response = await fetch(`/api/topics/${topicId}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer_type: answerType, content }),
    });
    const result = await response.json().catch(() => null) as { error?: string; unlockedAchievements?: UnlockedAchievement[] } | null;

    setIsSubmitting(false);
    if (!response.ok) {
      setMessage({ type: "error", text: result?.error ?? "回答の投稿に失敗しました。" });
      return;
    }

    setContent("");
    setAnswerType("Answer");
    setMessage({ type: "success", text: "回答を投稿しました。" });
    setUnlockedAchievements(result?.unlockedAchievements ?? []);
    router.refresh();
  }

  if (!canAnswer) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-league-silver">
        <h2 className="text-xl font-bold text-white">ログインすると議論に参加できます</h2>
        <p className="mt-3">Dailyの議論への回答は、ログイン済みかつ認定試験に合格したユーザーのみ投稿できます。</p>
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
      <AchievementNotice achievements={unlockedAchievements} />
    </form>
  );
}

type DebateReplyComposerProps = {
  answerId: string;
  parentReplyId?: string;
  canReply: boolean;
  blockedReason?: string;
  compact?: boolean;
};

export function DebateReplyComposer({ answerId, parentReplyId, canReply, blockedReason, compact = false }: DebateReplyComposerProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<DebateReplyType | null>(null);
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<MessageState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const availableTypes = parentReplyId ? (["rebuttal"] as DebateReplyType[]) : debateReplyTypes;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedType) return;
    setIsSubmitting(true);
    setMessage(null);
    setUnlockedAchievements([]);

    const response = await fetch(`/api/topic-answers/${answerId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, reply_type: selectedType, parent_reply_id: parentReplyId ?? null }),
    });
    const result = await response.json().catch(() => null) as { error?: string; unlockedAchievements?: UnlockedAchievement[] } | null;

    setIsSubmitting(false);
    if (!response.ok) {
      setMessage({ type: "error", text: result?.error ?? "投稿に失敗しました。" });
      return;
    }

    setContent("");
    setSelectedType(null);
    setMessage({ type: "success", text: `${formatReplyType(selectedType)}を投稿しました。` });
    setUnlockedAchievements(result?.unlockedAchievements ?? []);
    router.refresh();
  }

  return (
    <div className={compact ? "mt-3" : "mt-5"}>
      <div className="flex flex-wrap gap-2">
        {availableTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setSelectedType(type);
              setMessage(null);
            }}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-black text-league-silver transition hover:border-amber-300/35 hover:bg-white/[0.08] hover:text-white"
          >
            {formatReplyType(type)}する
          </button>
        ))}
      </div>

      {!canReply && selectedType ? (
        <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
          <p className="text-sm font-bold text-league-gold">{blockedReason ?? "ログインすると議論に参加できます"}</p>
          {blockedReason?.includes("ログイン") ? <a href="/login" className="mt-3 inline-flex rounded-full border border-amber-300/30 bg-black/25 px-4 py-2 text-xs font-black text-white transition hover:bg-amber-300/20">ログインする</a> : null}
        </div>
      ) : null}

      {canReply && selectedType ? (
        <form onSubmit={onSubmit} className="mt-3 rounded-2xl border border-amber-300/20 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(0,0,0,0.28))] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-white">{formatReplyType(selectedType)}を投稿</p>
            <button type="button" onClick={() => setSelectedType(null)} className="text-xs font-bold text-league-muted transition hover:text-white">閉じる</button>
          </div>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            required
            minLength={2}
            rows={compact ? 3 : 4}
            className="premium-textarea mt-3"
            placeholder="論点と根拠を明確に書いてください。"
          />
          <Button disabled={isSubmitting} className="mt-3 px-5 py-2 shadow-none">{isSubmitting ? "投稿中..." : `${formatReplyType(selectedType)}を投稿`}</Button>
          <Message message={message} />
          <AchievementNotice achievements={unlockedAchievements} />
        </form>
      ) : null}

      <Message message={message} />
    </div>
  );
}

export function CommentForm({ answerId, canComment }: { answerId: string; canComment: boolean }) {
  return <DebateReplyComposer answerId={answerId} canReply={canComment} blockedReason="ログインすると議論に参加できます" />;
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
