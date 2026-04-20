import type { Metadata } from "next";
import Link from "next/link";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import {
  dashboardDirectoryGroups,
  publicDirectoryGroups,
  staffDirectoryGroups,
} from "@/lib/site-directory";

export const metadata: Metadata = {
  title: "Site Directory",
  description: "Find the right Nation Wheel page, control panel, or tool.",
  alternates: { canonical: "/directory" },
};

function LinkList({
  links,
}: {
  links: Array<{ href: string; label: string; detail: string }>;
}) {
  return (
    <div className="grid gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-lg border border-white/10 bg-black/20 p-4 hover:border-emerald-300/60 hover:bg-white/5"
        >
          <span className="block font-bold text-zinc-50">{link.label}</span>
          <span className="mt-1 block text-sm leading-6 text-zinc-400">
            {link.detail}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function DirectoryPage() {
  return (
    <PageShell className="grid gap-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div>
          <Badge tone="accent">Directory</Badge>
          <h1 className="mt-4 text-4xl font-black text-zinc-50">
            Site Directory
          </h1>
          <p className="mt-3 max-w-3xl text-zinc-300">
            Nation Wheel is organized into public world pages, signed-in leader
            tools, and staff control panels.
          </p>
        </div>
        <div className="rounded-lg border border-emerald-300/25 bg-emerald-900/8 p-4">
          <p className="text-xs font-bold uppercase text-emerald-100">
            Quick Path
          </p>
          <div className="mt-3 grid gap-2">
            <Link
              href="/nations"
              className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm font-bold text-zinc-100 hover:border-emerald-300/50"
            >
              Browse the world
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm font-bold text-zinc-100 hover:border-emerald-300/50"
            >
              Manage my nation
            </Link>
            <Link
              href="/lorecp"
              className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm font-bold text-zinc-100 hover:border-emerald-300/50"
            >
              Open staff tools
            </Link>
          </div>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        {publicDirectoryGroups.map((group) => (
          <Panel key={group.title}>
            <Badge>{group.title}</Badge>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {group.detail}
            </p>
            <div className="mt-4">
              <LinkList links={group.links} />
            </div>
          </Panel>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <Panel>
          <Badge tone="accent">Signed In</Badge>
          {dashboardDirectoryGroups.map((group) => (
            <div key={group.title}>
              <h2 className="mt-3 text-2xl font-bold text-zinc-50">
                {group.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {group.detail}
              </p>
              <div className="mt-4">
                <LinkList links={group.links} />
              </div>
            </div>
          ))}
        </Panel>

        <Panel>
          <Badge tone="warning">Staff</Badge>
          <h2 className="mt-3 text-2xl font-bold text-zinc-50">
            Control Panels
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Staff tools are grouped by task so creation, publishing, and admin
            work do not blur together.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {staffDirectoryGroups.map((group) => (
              <div key={group.title} className="grid content-start gap-3">
                <div>
                  <h3 className="font-bold text-zinc-50">{group.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {group.detail}
                  </p>
                </div>
                <LinkList links={group.links} />
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </PageShell>
  );
}
