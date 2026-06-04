import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

type Tone = "gold" | "silver" | "emerald" | "rose" | "blue";

const toneClasses: Record<Tone, string> = {
  gold: "border-amber-300/30 bg-amber-300/10 text-league-gold",
  silver: "border-white/10 bg-white/[0.055] text-league-silver",
  emerald: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
  rose: "border-rose-300/30 bg-rose-500/10 text-rose-200",
  blue: "border-sky-300/25 bg-sky-400/10 text-sky-100",
};

export function PremiumCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <Card className={className}>{children}</Card>;
}

export function PageShell({ children, className = "max-w-6xl" }: { children: ReactNode; className?: string }) {
  return <main className={`mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:py-12 ${className}`}>{children}</main>;
}

export function HeroPanel({ eyebrow, title, children, actions, className = "" }: { eyebrow: string; title: ReactNode; children?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`relative overflow-hidden rounded-[2rem] border border-amber-300/20 bg-[radial-gradient(circle_at_top_right,rgba(215,180,106,0.2),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.075),rgba(8,13,26,0.78))] p-5 shadow-2xl sm:p-8 lg:p-10 ${className}`}>
      <div className="pointer-events-none absolute -right-14 -top-16 h-64 w-64 rounded-full bg-amber-300/12 blur-3xl" />
      <div className="pointer-events-none absolute left-8 top-0 h-px w-2/3 bg-gradient-to-r from-amber-200/80 via-white/20 to-transparent" />
      <div className="relative">
        <p className="text-xs font-black uppercase tracking-[0.34em] text-league-gold">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">{title}</h1>
        {children ? <div className="mt-5 max-w-3xl text-base leading-7 text-league-silver">{children}</div> : null}
        {actions ? <div className="mt-7 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}

export function SectionHeader({ eyebrow, title, children, action }: { eyebrow: string; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.32em] text-league-gold">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black leading-tight text-white sm:text-4xl">{title}</h2>
        {children ? <div className="mt-3 max-w-2xl text-sm leading-6 text-league-silver">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PremiumBadge({ children, tone = "silver", className = "" }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${toneClasses[tone]} ${className}`}>{children}</span>;
}

export function StatCard({ label, value, description, tone = "silver" }: { label: string; value: ReactNode; description?: ReactNode; tone?: Tone }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-4 ${toneClasses[tone]}`}>
      <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
      <span className="relative block text-[0.68rem] font-black uppercase tracking-[0.22em] opacity-80">{label}</span>
      <span className="relative mt-2 block text-3xl font-black text-white">{value}</span>
      {description ? <span className="relative mt-2 block text-xs leading-5 text-league-muted">{description}</span> : null}
    </div>
  );
}

export function MetricBar({ label, value, max = 20 }: { label: string; value: number | null; max?: number }) {
  const safeValue = Math.max(0, Math.min(Number(value ?? 0), max));
  const percent = (safeValue / max) * 100;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="mb-2 flex justify-between text-sm font-bold"><span className="text-white">{label}</span><span className="text-league-gold">{safeValue}/{max}</span></div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-amber-200 to-yellow-600 shadow-glow" style={{ width: `${percent}%` }} /></div>
    </div>
  );
}
