import type { Metadata } from "next";
import Link from "next/link";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import {
  dashboardDirectoryLinks,
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
      <div>
        <Badge tone="accent">Directory</Badge>
        <h1 className="mt-4 text-4xl font-black text-zinc-50">
          Find the Right Page
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-300">
          Nation Wheel is split into public canon, world reference, player
          dashboard tools, and staff control panels.
        </p>
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
          <h2 className="mt-3 text-2xl font-bold text-zinc-50">
            Player Dashboard
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Use these pages for your own nation, messages, and updates.
          </p>
          <div className="mt-4">
            <LinkList links={dashboardDirectoryLinks} />
          </div>
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
