"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RankBadge } from "@/components/rank/RankBadge";
import { Button } from "@/components/ui/Button";
import { LeagueIcon, type LeagueIconName } from "@/components/ui/LeagueIcon";
import { createPreview, formatDateTime, formatDiscussionType, formatReplyType } from "@/lib/topics/format";
import type { DebateReplyType } from "@/types/database";

type ThoughtType = "ANSWER" | "COUNTER" | "REBUTTAL" | "SUPPORT" | "QUESTION";
type ComposerMode = "comment" | DebateReplyType;
type MessageState = { type: "success" | "error"; text: string } | null;
type UnlockedAchievement = { key: string; title: string; badgeIcon: string };

export type ThoughtFeedItem = {
  id: string;
  type: ThoughtType;
  topicId: string;
  answerId: string;
  parentReplyId?: string;
  href: string;
  discussionTitle: string;
  discussionType?: string | null;
  content: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByCurrentUser: boolean;
  isSample?: boolean;
  author: {
    id: string;
    displayName: string;
    username?: string | null;
    rank?: string | null;
    href: string;
  };
};

const typeStyles: Record<ThoughtType, { label: string; icon: LeagueIconName; tone: string }> = {
  ANSWER: { label: "回答", icon: "answer", tone: "border-sky-300/30 bg-sky-300/10 text-sky-100" },
  COUNTER: { label: "反論", icon: "counter", tone: "border-red-300/30 bg-red-300/10 text-red-100" },
  REBUTTAL: { label: "再反論", icon: "counter", tone: "border-orange-300/30 bg-orange-300/10 text-orange-100" },
  SUPPORT: { label: "補足", icon: "support", tone: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" },
  QUESTION: { label: "質問", icon: "question", tone: "border-purple-300/30 bg-purple-300/10 text-purple-100" },
};

const debateActions: { type: DebateReplyType; label: string; icon: LeagueIconName }[] = [
  { type: "counter", label: "反論", icon: "counter" },
  { type: "support", label: "補足", icon: "support" },
  { type: "question", label: "質問", icon: "question" },
];

export function ThoughtFeed({ items, initialCount = 14, canInteract, blockedReason }: { items: ThoughtFeedItem[]; initialCount?: number; canInteract: boolean; blockedReason: string }) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;

  return (
    <div>
      <section className="-mx-4 border-x border-white/10 sm:-mx-5" aria-label="思考フィード">
        {visibleItems.map((item) => <ThoughtCard key={item.id} item={item} canInteract={canInteract} blockedReason={blockedReason} />)}
        {items.length === 0 ? <p className="py-8 text-center text-sm font-bold text-league-muted">まだ回答はありません</p> : null}
      </section>
      {hasMore ? (
        <div className="py-5 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => Math.min(count + 12, items.length))}
            className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:border-amber-300/35 hover:bg-white/[0.1]"
          >
            さらに読み込む
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ThoughtCard({ item, canInteract, blockedReason }: { item: ThoughtFeedItem; canInteract: boolean; blockedReason: string }) {
  const router = useRouter();
  const style = typeStyles[item.type];
  const [liked, setLiked] = useState(item.likedByCurrentUser);
  const [likeCount, setLikeCount] = useState(item.likeCount);
  const [commentCount, setCommentCount] = useState(item.commentCount);
  const [composerMode, setComposerMode] = useState<ComposerMode | null>(null);
  const [content, setContent] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);
  const [showDebateSheet, setShowDebateSheet] = useState(false);

  function requireInteraction(mode: ComposerMode) {
    setMessage(null);
    setShowDebateSheet(false);
    setComposerMode(mode);
    if (!canInteract) setContent("");
  }

  async function toggleLike() {
    setMessage(null);
    if (!canInteract) {
      setComposerMode(null);
      setMessage({ type: "error", text: blockedReason });
      return;
    }

    const previousLiked = liked;
    const previousCount = likeCount;
    setLiked(!previousLiked);
    setLikeCount(Math.max(0, previousCount + (previousLiked ? -1 : 1)));
    setIsLiking(true);

    const response = await fetch(`/api/topic-answers/${item.answerId}/like`, { method: "POST" });
    const result = await response.json().catch(() => null) as { error?: string; liked?: boolean } | null;
    setIsLiking(false);

    if (!response.ok) {
      setLiked(previousLiked);
      setLikeCount(previousCount);
      setMessage({ type: "error", text: result?.error ?? "いいねの更新に失敗しました。" });
      return;
    }

    if (typeof result?.liked === "boolean" && result.liked !== !previousLiked) {
      setLiked(result.liked);
      setLikeCount(Math.max(0, previousCount + (result.liked ? 1 : -1)));
    }
    router.refresh();
  }

  async function submitReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!composerMode) return;
    setIsSubmitting(true);
    setMessage(null);

    const replyType: DebateReplyType = composerMode === "comment" ? "support" : composerMode;
    const response = await fetch(`/api/topic-answers/${item.answerId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, reply_type: replyType, parent_reply_id: item.parentReplyId ?? null }),
    });
    const result = await response.json().catch(() => null) as { error?: string; unlockedAchievements?: UnlockedAchievement[] } | null;
    setIsSubmitting(false);

    if (!response.ok) {
      setMessage({ type: "error", text: result?.error ?? "投稿に失敗しました。" });
      return;
    }

    setCommentCount((count) => count + 1);
    setContent("");
    setComposerMode(null);
    const label = composerMode === "comment" ? "コメント" : formatReplyType(composerMode);
    const achievementText = result?.unlockedAchievements?.length ? ` 新しい実績: ${result.unlockedAchievements.map((achievement) => achievement.title).join("、")}` : "";
    setMessage({ type: "success", text: `${label}を投稿しました。${achievementText}` });
    router.refresh();
  }

  const composerLabel = composerMode === "comment" ? "コメント" : composerMode ? formatReplyType(composerMode) : "";

  return (
    <article id={`feed-${item.id}`} className="border-b border-white/10 bg-white/[0.018] px-4 py-4 transition hover:bg-white/[0.045] sm:px-5 sm:py-5">
      <Link href={item.href} className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-300/35" aria-label={`${item.discussionTitle}の議論を見る`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-league-gold/25 bg-league-gold/10 px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.16em] text-league-gold">{formatDiscussionType(item.discussionType)}</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-black ${style.tone}`}>
            <LeagueIcon name={style.icon} size={13} />
            {style.label}
          </span>
          {item.isSample ? <span className="rounded-full border border-sky-300/30 bg-sky-300/10 px-2.5 py-1 text-[0.68rem] font-black text-sky-100">公式サンプル</span> : null}
        </div>
        <h2 className="mt-3 line-clamp-2 text-base font-black leading-snug text-white sm:text-lg">{item.discussionTitle}</h2>
        <p className="mt-3 whitespace-pre-wrap break-words text-[0.95rem] leading-7 text-league-silver sm:text-base">{createPreview(item.content, 240)}</p>
      </Link>

      <div className="mt-4 flex min-w-0 items-center gap-2 text-xs text-league-muted">
        <RankBadge rank={item.author.rank} size="small" />
        <Link href={item.author.href} className="truncate font-black text-white transition hover:text-league-gold">{item.isSample ? "Logic League運営" : item.author.displayName}</Link>
        {item.author.username ? <span className="truncate">@{item.author.username}</span> : null}
        <span>·</span>
        <time>{formatDateTime(item.createdAt)}</time>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/20 p-1.5 text-xs font-black text-league-muted sm:gap-3">
        <button
          type="button"
          onClick={toggleLike}
          disabled={isLiking}
          aria-pressed={liked}
          className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-60 ${liked ? "text-league-gold" : ""}`}
        >
          <span aria-hidden="true">{liked ? "♥" : "♡"}</span>
          <span>いいね</span>
          <span>{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={() => requireInteraction("comment")}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 transition hover:bg-white/[0.08] hover:text-white"
        >
          <LeagueIcon name="comment" size={15} />
          <span>コメント</span>
          <span>{commentCount}</span>
        </button>
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setShowDebateSheet((open) => !open)}
            className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 transition hover:bg-white/[0.08] hover:text-white"
          >
            <LeagueIcon name="counter" size={15} />
            <span>反論</span>
          </button>
          {showDebateSheet ? (
            <div className="absolute right-0 top-12 z-20 w-44 rounded-2xl border border-amber-300/20 bg-league-black/95 p-2 shadow-2xl backdrop-blur">
              {debateActions.map((action) => (
                <button
                  key={action.type}
                  type="button"
                  onClick={() => requireInteraction(action.type)}
                  className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-black text-league-silver transition hover:bg-white/[0.08] hover:text-white"
                >
                  <LeagueIcon name={action.icon} size={15} />
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <Link href={item.href} className="hidden min-h-11 flex-1 items-center justify-center rounded-xl px-2.5 py-2 text-center transition hover:bg-white/[0.08] hover:text-white sm:inline-flex">詳細</Link>
      </div>

      {!canInteract && composerMode ? (
        <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
          <p className="text-sm font-bold text-league-gold">{blockedReason}</p>
          {blockedReason.includes("ログイン") ? <a href="/login" className="mt-3 inline-flex rounded-full border border-amber-300/30 bg-black/25 px-4 py-2 text-xs font-black text-white transition hover:bg-amber-300/20">ログインする</a> : null}
        </div>
      ) : null}

      {canInteract && composerMode ? (
        <form onSubmit={submitReply} className="mt-3 rounded-2xl border border-amber-300/20 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(0,0,0,0.28))] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-white">{composerLabel}を投稿</p>
            <button type="button" onClick={() => setComposerMode(null)} className="text-xs font-bold text-league-muted transition hover:text-white">閉じる</button>
          </div>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            required
            minLength={2}
            rows={3}
            className="premium-textarea mt-3"
            placeholder="論点と根拠を明確に書いてください。"
          />
          <Button disabled={isSubmitting} className="mt-3 px-5 py-2 shadow-none">{isSubmitting ? "投稿中..." : `${composerLabel}を投稿`}</Button>
        </form>
      ) : null}

      {message ? (
        <div className="mt-3">
          <p className={`text-sm font-bold ${message.type === "success" ? "text-emerald-300" : "text-red-300"}`}>{message.text}</p>
          {message.type === "error" && blockedReason.includes("ログイン") ? <a href="/login" className="mt-2 inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-xs font-black text-league-gold transition hover:bg-amber-300/20 hover:text-white">ログインする</a> : null}
        </div>
      ) : null}
    </article>
  );
}
