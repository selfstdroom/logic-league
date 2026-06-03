"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MIN_EXAM_ANSWER_LENGTH } from "@/lib/scoring";

export function ExamForm() {
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const count = useMemo(() => answer.length, [answer]);
  const canSubmit = count >= MIN_EXAM_ANSWER_LENGTH && !isPending;

  async function submit() {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        setError(payload?.error ?? "提出に失敗しました。");
        return;
      }
      router.push("/exam/result");
      router.refresh();
    });
  }

  return (
    <Card className="space-y-5 border-amber-300/20">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-league-gold">答案用紙</p>
        <h2 className="mt-2 text-2xl font-black text-white">政策論述答案</h2>
        <p className="mt-2 text-sm leading-6 text-league-muted">構造、仮説、実現性、リスクを読み手が追えるように記述してください。</p>
      </div>
      <textarea
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        className="min-h-[420px] w-full rounded-[1.75rem] border border-white/10 bg-black/40 p-5 text-base leading-8 text-white placeholder:text-league-muted focus:border-league-gold focus:ring-league-gold"
        placeholder="500文字以上で、問題の定義・原因仮説・3年間の施策・失敗要因・防止策を具体的に書いてください。"
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className={count < MIN_EXAM_ANSWER_LENGTH ? "text-sm text-rose-300" : "text-sm text-emerald-300"}>
          {count} / {MIN_EXAM_ANSWER_LENGTH}文字以上（推奨1000〜2000文字）
        </p>
        <Button disabled={!canSubmit} onClick={submit}>{isPending ? "AI採点中..." : "回答を提出してAI採点"}</Button>
      </div>
      {error ? <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</p> : null}
    </Card>
  );
}
