import type { Metadata } from "next";
import Link from "next/link";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import {
  dashboardDirectoryGroups,
  publicDirectoryGroups,
  staffDirectoryGroups,
} from "@/lib/site-directory";

export const metadata: Metadata = {
  title: "How To Use Nation Wheel",
  description:
    "Detailed role-by-role guide to Nation Wheel pages, tools, and workflows.",
  alternates: { canonical: "/how-to-use" },
};

const roleGuides = [
  {
    role: "Visitors",
    summary: "Read the public world state without signing in.",
    steps: [
      "Start on Nations to inspect profiles, stats, maps, and public lore.",
      "Use Actions to see active canon work and the completed archive.",
      "Read News, Forums, World Lore, Wars, Leaderboards, and Map for context.",
    ],
  },
  {
    role: "Nation Leaders",
    summary: "Manage one controlled nation and keep up with staff decisions.",
    steps: [
      "Open Dashboard for shortcuts, unread mail, notifications, and your nation tools.",
      "Use My Nation to edit public wiki text, leader name, and profile image.",
      "Use My Actions for current actions, spin requirements, completed outcomes, and private records.",
      "Use Postal Service and Notifications for diplomacy, staff notices, and unread alerts.",
      "Open Private Records from your nation profile to store completed-action notes and screenshots.",
    ],
  },
  {
    role: "Journalists",
    summary: "Publish world-facing reports and keep public updates readable.",
    steps: [
      "Use NewsCP to create reports with summaries, source labels, and images.",
      "Check public News after publishing to make sure the lead story and ticker read correctly.",
      "Use Forums and Directory to find the context pages that support a report.",
    ],
  },
  {
    role: "Lore Staff",
    summary: "Review canon, run actions, make spin decisions, and maintain world pages.",
    steps: [
      "Use LoreCP for nation review, the world clock, action tracking, and lore page editing.",
      "Create actions from LoreCP Actions, update status, add updates, and complete outcomes with stat effects.",
      "Use the wheel for weighted decisions, then save the prompt, options, and result into the action log.",
      "Use each nation's Private Records page to review or add evidence for completed actions.",
    ],
  },
  {
    role: "Admins and Owners",
    summary: "Manage users, nation ownership, structured stats, and audit history.",
    steps: [
      "Use AdminCP for management shortcuts and health checks.",
      "Use Users & Roles to assign roles, Discord IDs, and nation controllers.",
      "Use Nation Management and Map tools for structured data and visual maintenance.",
      "Use Logs when you need to audit profile, wiki, flag, or stat changes.",
    ],
  },
];

function PageCatalog({
  title,
  groups,
}: {
  title: string;
  groups: Array<{
    title: string;
    detail: string;
    links: Array<{ href: string; label: string; detail: string }>;
  }>;
}) {
  return (
    <section className="grid gap-4">
      <h2 className="text-2xl font-black text-zinc-50">{title}</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        {groups.map((group) => (
          <Panel key={group.title}>
            <Badge>{group.title}</Badge>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {group.detail}
            </p>
            <div className="mt-4 grid gap-2">
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg border border-white/10 bg-black/20 p-3 hover:border-emerald-300/50 hover:bg-white/5"
                >
                  <span className="block font-bold text-zinc-50">
                    {link.label}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-zinc-400">
                    {link.detail}
                  </span>
                </Link>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </section>
  );
}

export default function HowToUsePage() {
  return (
    <PageShell className="grid gap-8">
      <header>
        <Badge tone="accent">Guide</Badge>
        <h1 className="mt-4 text-4xl font-black text-zinc-50">
          How To Use Nation Wheel
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-300">
          Use this page as the operating manual: first choose your role, then
          open the page catalog for the exact tool you need.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        {roleGuides.map((guide) => (
          <Panel key={guide.role}>
            <Badge tone="warning">{guide.role}</Badge>
            <h2 className="mt-3 text-2xl font-bold text-zinc-50">
              {guide.summary}
            </h2>
            <ul className="mt-4 grid gap-3 text-sm leading-7 text-zinc-300">
              {guide.steps.map((step) => (
                <li
                  key={step}
                  className="rounded-lg border border-white/10 bg-black/20 p-3"
                >
                  {step}
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </section>

      <PageCatalog title="Public Pages" groups={publicDirectoryGroups} />
      <PageCatalog title="Signed-In Pages" groups={dashboardDirectoryGroups} />
      <PageCatalog title="Staff Pages" groups={staffDirectoryGroups} />
    </PageShell>
  );
}
