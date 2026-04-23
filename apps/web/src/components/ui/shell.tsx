import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Image from "next/image";
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
        "mx-auto grid w-full max-w-screen-2xl gap-10 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12",
        "max-[420px]:gap-7 max-[420px]:px-3 max-[420px]:py-6",
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
  ...props
}: {
  children: ReactNode;
  className?: string;
} & ComponentPropsWithoutRef<"section">) {
  return (
    <section
      {...props}
      className={cn(
        "min-w-0 rounded-lg border border-[color:var(--line)] bg-[color:var(--panel)]/96 p-5 shadow-xl shadow-black/22 ring-1 ring-white/[0.06] sm:p-6",
        "max-[420px]:p-4",
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
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold uppercase leading-none",
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
  iconSrc,
  iconAlt,
}: {
  label: string;
  value: string;
  unit?: string;
  info?: ReactNode;
  iconSrc?: string;
  iconAlt?: string;
}) {
  return (
    <div className="rounded-lg border border-white/12 bg-black/25 p-4 shadow-inner shadow-white/[0.02]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-zinc-300">
          <span>{label}</span>
          {info ? (
            <InfoTooltip label={`${label} details`}>{info}</InfoTooltip>
          ) : null}
        </div>
        {iconSrc ? (
          <Image
            src={iconSrc}
            alt={iconAlt ?? ""}
            width={28}
            height={28}
            className="h-7 w-7 rounded-md object-cover"
          />
        ) : null}
      </div>
      <div className="mt-2 text-base font-bold leading-6 text-zinc-50">
        {value}
      </div>
      {unit ? <div className="mt-1 text-xs text-zinc-400">{unit}</div> : null}
    </div>
  );
}
