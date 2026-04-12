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
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
      <aside className="rounded-lg border border-white/10 bg-[color:var(--panel)]/90 p-4">
        <div className="mb-4 text-xs font-bold uppercase text-emerald-200">
          {title}
        </div>
        <nav className="grid gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section>{children}</section>
    </main>
  );
}
