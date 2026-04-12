import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12",
        className,
      )}
    >
      {children}
    </main>
  );
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-[color:var(--line)] bg-[color:var(--panel)]/94 p-5 shadow-xl shadow-black/25 ring-1 ring-white/[0.04] sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "warning";
}) {
  const tones = {
    neutral: "border-zinc-500/80 bg-zinc-900/90 text-zinc-100",
    accent: "border-emerald-300/70 bg-emerald-300/14 text-emerald-100",
    warning: "border-amber-300/70 bg-amber-300/14 text-amber-50",
  };

  return (
    <span
      className={cn(
        "rounded-md border px-2.5 py-1 text-xs font-semibold uppercase",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function InfoTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={0}
        aria-label={label}
        className="grid h-5 w-5 cursor-help place-items-center rounded-full border border-emerald-200/60 bg-emerald-200/10 text-xs font-black text-emerald-100 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200"
      >
        i
      </span>
      <span className="pointer-events-none absolute left-1/2 top-7 z-30 hidden w-64 -translate-x-1/2 rounded-lg border border-white/15 bg-[#11140f] p-3 text-left text-xs font-medium leading-5 text-zinc-100 shadow-2xl shadow-black/40 group-hover:block group-focus-within:block">
        {children}
      </span>
    </span>
  );
}

export function MetricCard({
  label,
  value,
  unit,
  info,
}: {
  label: string;
  value: string;
  unit?: string;
  info?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/12 bg-black/25 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-zinc-300">
        <span>{label}</span>
        {info ? <InfoTooltip label={`${label} details`}>{info}</InfoTooltip> : null}
      </div>
      <div className="mt-2 text-base font-bold leading-6 text-zinc-50">
        {value}
      </div>
      {unit ? <div className="mt-1 text-xs text-zinc-400">{unit}</div> : null}
    </div>
  );
}
