import Link from "next/link";
import type { ReactNode } from "react";
import { ControlPanelNav } from "@/components/layout/control-panel-nav";
import { Badge } from "@/components/ui/shell";

export function ControlLayout({
  title,
  description,
  eyebrow,
  stats,
  links,
  children,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  stats?: Array<{ label: string; value: string | number }>;
  links: { href: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <main className="mx-auto grid w-full max-w-screen-2xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
      <aside className="rounded-lg border border-white/10 bg-[color:var(--panel)]/94 p-4 shadow-lg shadow-black/20 lg:sticky lg:top-24 lg:self-start">
        <div className="grid gap-4">
          <div className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">{eyebrow ?? title}</Badge>
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                Control Panel
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-50">{title}</h1>
              {description ? (
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {description}
                </p>
              ) : null}
            </div>
            {stats?.length ? (
              <div className="grid grid-cols-2 gap-2">
                {stats.slice(0, 4).map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-md border border-white/10 bg-black/25 p-3"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-xl font-black text-zinc-50">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          <Link
            href="/dashboard"
            className="rounded-md border border-emerald-300/35 bg-emerald-900/10 px-3 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-900/15"
          >
            Dashboard
          </Link>
          <Link
            href="/directory"
            className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm font-bold text-zinc-200 hover:bg-white/5"
            >
              Directory
            </Link>
          </div>

          <ControlPanelNav links={links} />
        </div>
      </aside>
      <section className="min-w-0">{children}</section>
    </main>
  );
}
