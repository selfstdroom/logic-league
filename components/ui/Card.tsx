import type { HTMLAttributes, ReactNode } from "react";

export function Card({ children, className = "", ...props }: { children: ReactNode; className?: string } & HTMLAttributes<HTMLElement>) {
  return (
    <section {...props} className={`relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(215,180,106,0.075),transparent_30%),linear-gradient(145deg,rgba(255,255,255,0.07),rgba(8,13,26,0.76))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_54px_rgba(0,0,0,0.26)] transition sm:rounded-[1.5rem] sm:p-6 sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_80px_rgba(0,0,0,0.28)] duration-300 ${className}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      {children}
    </section>
  );
}
