import Link from "next/link";
import type { ReactNode } from "react";

export function ControlLayout({
  title,
  links,
  children,
}: {
  title: string;
  links: { href: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <main className="mx-auto grid w-full max-w-screen-2xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
      <aside className="rounded-lg border border-white/10 bg-[color:var(--panel)]/94 p-4 shadow-lg shadow-black/20 lg:sticky lg:top-24 lg:self-start">
        <div className="mb-4 rounded-md border border-emerald-300/25 bg-emerald-900/10 px-3 py-2 text-xs font-bold uppercase text-emerald-100">
          {title}
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
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
        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md border border-white/8 bg-white/[0.02] px-3 py-2 text-sm font-semibold text-zinc-300 hover:border-emerald-300/40 hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="min-w-0">{children}</section>
    </main>
  );
}
