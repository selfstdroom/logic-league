"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createPreview, formatDateTime } from "@/lib/topics/format";
import type { TopicAnswerType } from "@/types/database";

type SortKey = "newest" | "oldest" | "score-desc" | "score-asc";
type FilterKey = "all" | "exam" | "daily" | TopicAnswerType;

type ExamHistoryItem = {
  kind: "exam";
  id: string;
  created_at: string;
  answer: string;
  predicted_deviation: number | null;
  archetype: string | null;
  total_score: number | null;
  structure_score: number | null;
  hypothesis_score: number | null;
  originality_score: number | null;
  feasibility_score: number | null;
  risk_score: number | null;
  summary: string | null;
  strength: string | null;
  weakness: string | null;
  upper_gap: string | null;
};

type TopicHistoryItem = {
  kind: "topic";
  id: string;
  topic_id: string;
  created_at: string;
  answer_type: TopicAnswerType | null;
  content: string;
  category: string;
  title: string;
  likeCount: number;
  commentCount: number;
};

export type AnswerHistoryItem = ExamHistoryItem | TopicHistoryItem;

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "newest", label: "新しい順" },
  { value: "oldest", label: "古い順" },
  { value: "score-desc", label: "スコア高い順" },
  { value: "score-asc", label: "スコア低い順" },
];

const filterOptions: { value: FilterKey; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "exam", label: "認定試験" },
  { value: "daily", label: "Daily Topic" },
  { value: "Answer", label: "Answer" },
  { value: "Counter", label: "Counter" },
  { value: "Support", label: "Support" },
  { value: "Question", label: "Question" },
];

function scoreOf(item: AnswerHistoryItem) {
  return item.kind === "exam" ? item.total_score : null;
}

function ToggleButton({ id, expanded, onToggle }: { id: string; expanded: boolean; onToggle: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(id)}
      className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-bold text-league-gold transition hover:bg-amber-300/20"
    >
      {expanded ? "閉じる" : "続きを読む"}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-league-muted">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value ?? "—"}</p>
    </div>
  );
}

export function AnswerHistory({ items, isOwnProfile }: { items: AnswerHistoryItem[]; isOwnProfile: boolean }) {
  const [sort, setSort] = useState<SortKey>("newest");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => {
      if (filter === "all") return true;
      if (filter === "exam") return item.kind === "exam";
      if (filter === "daily") return item.kind === "topic";
      return item.kind === "topic" && item.answer_type === filter;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "newest" || sort === "oldest") {
        const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return sort === "newest" ? diff : -diff;
      }

      const aScore = scoreOf(a);
      const bScore = scoreOf(b);
      if (aScore === null && bScore === null) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (aScore === null) return 1;
      if (bScore === null) return -1;
      return sort === "score-desc" ? bScore - aScore : aScore - bScore;
    });
  }, [filter, items, sort]);

  function toggle(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="mt-8">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">Thought Archive</p>
          <h2 className="mt-2 text-3xl font-black">思考ログ</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-league-silver">認定試験とDaily Topicへの回答を時系列で確認できます。スコアや回答タイプで絞り込み、思考の変化を追跡できます。</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[28rem]">
          <label className="text-xs font-bold text-league-muted">
            並び替え
            <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm font-bold text-white">
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-league-muted">
            フィルター
            <select value={filter} onChange={(event) => setFilter(event.target.value as FilterKey)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm font-bold text-white">
              {filterOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="space-y-5">
        {visibleItems.map((item) => {
          const expanded = expandedIds.has(item.id);
          if (item.kind === "exam") {
            return (
              <article key={item.id} className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(7,12,23,0.74))] p-5 shadow-2xl sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-black tracking-[0.18em] text-league-gold">認定試験</span>
                      {!isOwnProfile ? <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-league-silver">認定試験回答</span> : null}
                      <time className="text-xs text-league-muted">{formatDateTime(item.created_at)}</time>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <Metric label="推定思考偏差値" value={item.predicted_deviation} />
                      <Metric label="思考アーキタイプ" value={item.archetype} />
                      <Metric label="Total Score" value={item.total_score} />
                    </div>
                  </div>
                  <ToggleButton id={item.id} expanded={expanded} onToggle={toggle} />
                </div>
                <p className="mt-5 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-7 text-league-silver">
                  {expanded ? item.answer : createPreview(item.answer, 220)}
                </p>
                {expanded ? (
                  <div className="mt-5 space-y-5 border-t border-white/10 pt-5">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <Metric label="Structure" value={item.structure_score} />
                      <Metric label="Hypothesis" value={item.hypothesis_score} />
                      <Metric label="Originality" value={item.originality_score} />
                      <Metric label="Feasibility" value={item.feasibility_score} />
                      <Metric label="Risk" value={item.risk_score} />
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <Detail title="summary" text={item.summary} />
                      <Detail title="strength" text={item.strength} />
                      <Detail title="weakness" text={item.weakness} />
                      <Detail title="upper_gap" text={item.upper_gap} />
                    </div>
                  </div>
                ) : null}
              </article>
            );
          }

          return (
            <article key={item.id} className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-black tracking-[0.18em] text-league-gold">Daily Topic</span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-league-silver">{item.category}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-league-silver">{item.answer_type ?? "Answer"}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-black leading-snug text-white">{item.title}</h3>
                  <p className="mt-2 text-xs text-league-muted">{formatDateTime(item.created_at)}</p>
                </div>
                <Link href={`/topics/${item.topic_id}`} className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white transition hover:border-amber-300/40 hover:text-league-gold">Topicを見る</Link>
              </div>
              <p className="mt-5 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-7 text-league-silver">
                {expanded ? item.content : createPreview(item.content, 220)}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-3 text-xs font-bold text-league-muted">
                  <span>いいね {item.likeCount}</span>
                  <span>コメント {item.commentCount}</span>
                </div>
                <ToggleButton id={item.id} expanded={expanded} onToggle={toggle} />
              </div>
            </article>
          );
        })}
      </div>

      {visibleItems.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
          <h3 className="text-xl font-black">まだ投稿はありません。</h3>
          <p className="mt-3 text-sm text-league-silver">最初の回答を投稿して、議論を始めましょう。</p>
        </div>
      ) : null}
    </section>
  );
}

function Detail({ title, text }: { title: string; text: string | null }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-league-muted">{title}</p>
      <p className="mt-2 text-sm leading-7 text-league-silver">{text ?? "—"}</p>
    </div>
  );
}
