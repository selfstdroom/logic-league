import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.065),rgba(8,13,26,0.74))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:rounded-[1.5rem] sm:p-6 shadow-2xl transition duration-300 ${className}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      {children}
    </section>
  );
}
