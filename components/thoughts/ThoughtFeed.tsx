"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RankBadge } from "@/components/rank/RankBadge";
import { LeagueIcon, type LeagueIconName } from "@/components/ui/LeagueIcon";
import { createPreview, formatDateTime, formatDiscussionType } from "@/lib/topics/format";

type ThoughtType = "ANSWER" | "COUNTER" | "REBUTTAL" | "SUPPORT" | "QUESTION";

export type ThoughtFeedItem = {
  id: string;
  type: ThoughtType;
  topicId: string;
  answerId: string;
  href: string;
  discussionTitle: string;
  discussionType?: string | null;
  content: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
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

export function ThoughtFeed({ items, initialCount = 14 }: { items: ThoughtFeedItem[]; initialCount?: number }) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;

  return (
    <div>
      <section className="-mx-4 border-x border-white/10 sm:-mx-5" aria-label="思考フィード">
        {visibleItems.map((item) => <ThoughtCard key={item.id} item={item} />)}
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

function ThoughtCard({ item }: { item: ThoughtFeedItem }) {
  const style = typeStyles[item.type];
  return (
    <article id={`feed-${item.id}`} className="border-b border-white/10 bg-white/[0.018] px-4 py-4 transition hover:bg-white/[0.045] sm:px-5 sm:py-5">
      <Link href={item.href} className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-300/35">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-league-gold/25 bg-league-gold/10 px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.16em] text-league-gold">{formatDiscussionType(item.discussionType)}</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-black ${style.tone}`}>
            <LeagueIcon name={style.icon} size={13} />
            {style.label}
          </span>
        </div>
        <h2 className="mt-3 line-clamp-2 text-base font-black leading-snug text-white sm:text-lg">{item.discussionTitle}</h2>
        <p className="mt-3 whitespace-pre-wrap break-words text-[0.95rem] leading-7 text-league-silver sm:text-base">{createPreview(item.content, 240)}</p>
        <div className="mt-4 flex items-center gap-4 text-sm font-black text-league-muted">
          <span aria-label="いいね">👍 {item.likeCount}</span>
          <span aria-label="コメント">💬 {item.commentCount}</span>
        </div>
      </Link>

      <div className="mt-4 flex min-w-0 items-center gap-2 text-xs text-league-muted">
        <RankBadge rank={item.author.rank} size="xs" />
        <Link href={item.author.href} className="truncate font-black text-white transition hover:text-league-gold">{item.author.displayName}</Link>
        {item.author.username ? <span className="truncate">@{item.author.username}</span> : null}
        <span>·</span>
        <time>{formatDateTime(item.createdAt)}</time>
      </div>
    </article>
  );
}
