"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
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
    <div className="space-y-4">
      <textarea
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        className="min-h-[420px] w-full rounded-3xl border-white/10 bg-black/40 p-5 text-base leading-8 text-white placeholder:text-league-muted focus:border-league-gold focus:ring-league-gold"
        placeholder="500文字以上で、問題の定義・原因仮説・3年間の施策・失敗要因・防止策を具体的に書いてください。"
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className={count < MIN_EXAM_ANSWER_LENGTH ? "text-sm text-rose-300" : "text-sm text-emerald-300"}>
          {count} / {MIN_EXAM_ANSWER_LENGTH}文字以上（推奨1000〜2000文字）
        </p>
        <Button disabled={!canSubmit} onClick={submit}>{isPending ? "AI採点中..." : "回答を提出してAI採点"}</Button>
      </div>
      {error ? <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</p> : null}
    </div>
  );
}
