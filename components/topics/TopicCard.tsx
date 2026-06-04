import Link from "next/link";
import { createPreview, formatDateTime, formatDiscussionType, formatTopicCategory } from "@/lib/topics/format";

type TopicCardProps = {
  topic: {
    id: string;
    category: string;
    title: string;
    content: string;
    publish_at?: string | null;
    type?: string | null;
    answerCount?: number;
    commentCount?: number;
  };
  featured?: boolean;
};

export function TopicCard({ topic, featured = false }: TopicCardProps) {
  return (
    <Link href={`/topics/${topic.id}`} className="group block h-full">
      <article className={`relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(7,12,23,0.72))] p-5 shadow-2xl transition duration-300 hover:-translate-y-1 hover:border-amber-300/45 hover:shadow-[0_24px_80px_rgba(215,180,106,0.16)] ${featured ? "md:p-7" : ""}`}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/70 to-transparent" />
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-200/10 blur-3xl transition group-hover:bg-amber-200/20" />
        <div className="relative flex items-start justify-between gap-4">
          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.22em] text-league-gold">
            {formatDiscussionType(topic.type)}
          </span>
          {topic.publish_at ? <time className="text-right text-xs leading-5 text-league-muted">{formatDateTime(topic.publish_at)}</time> : null}
        </div>
        <h2 className={`${featured ? "text-3xl" : "text-2xl"} relative mt-5 font-black leading-tight text-white transition group-hover:text-league-gold`}>
          {topic.title}
        </h2>
        <p className="relative mt-4 flex-1 text-sm leading-6 text-league-silver">{createPreview(topic.content, featured ? 150 : 105)}</p>
        <div className="relative mt-4 flex flex-wrap gap-2 text-xs font-bold text-league-muted">
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">{formatTopicCategory(topic.category)}</span>
          {typeof topic.answerCount === "number" ? <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">回答 {topic.answerCount}</span> : null}
          {typeof topic.commentCount === "number" ? <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">コメント {topic.commentCount}</span> : null}
        </div>
        <div className="relative mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-bold uppercase tracking-[0.2em] text-league-muted">
          <span>回答を見る</span>
          <span className="text-league-gold transition group-hover:translate-x-1">→</span>
        </div>
      </article>
    </Link>
  );
}
