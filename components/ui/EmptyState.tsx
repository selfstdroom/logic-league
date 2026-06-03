import type { ReactNode } from "react";

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-dashed border-white/15 bg-white/[0.035] p-8 text-center">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-amber-300/25 bg-amber-300/10">
        <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
          <path d="M32 7 52 18v20L32 57 12 38V18Z" fill="none" stroke="#d7b46a" strokeWidth="3" />
          <path d="M21 32h24M32 20v24" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="text-xl font-black text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-league-silver">{children}</p>
    </div>
  );
}
