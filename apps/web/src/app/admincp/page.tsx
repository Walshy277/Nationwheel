import Link from "next/link";
import { Role } from "@prisma/client";
import { GameDateControl } from "@/components/control/game-date-control";
import { ControlLayout } from "@/components/layout/control-sidebar";
import { Badge, Panel } from "@/components/ui/shell";
import { adminCpLinks } from "@/lib/control-panels";
import { getPrisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/permissions";

const quickActions = [
  {
    href: "/admincp/users",
    label: "Users & Roles",
    detail: "Assign access, clean up role drift, and link controllers fast.",
    tone: "accent",
  },
  {
    href: "/admincp/nations",
    label: "Nation Registry",
    detail: "Create nations, fix profile data, and take over wiki cleanup.",
    tone: "accent",
  },
  {
    href: "/admincp/logs",
    label: "Unified Logs",
    detail: "See revisions, lore updates, alerts, and news in one stream.",
    tone: "warning",
  },
  {
    href: "/newscp",
    label: "News Desk",
    detail: "Open the publishing panel without leaving the staff shell.",
    tone: "neutral",
  },
] as const;

const contentActions = [
  { href: "/lorecp/pages/announcements", label: "Announcements" },
  { href: "/newscp", label: "News Reports" },
  { href: "/lorecp/pages/lore", label: "World Lore" },
  { href: "/lorecp/pages/wars", label: "Wars Page" },
  { href: "/admincp/map", label: "Map Assets" },
] as const;

export default async function AdminCpPage() {
  await requirePageRole([Role.ADMIN, Role.OWNER]);
  const [
    nationCount,
    userCount,
    revisionCount,
    linkedNationCount,
    unreadAlerts,
    actionsNeedingSpin,
  ] = await Promise.all([
    getPrisma().nation.count(),
    getPrisma().user.count(),
    getPrisma().nationRevision.count(),
    getPrisma().nation.count({ where: { leaderUserId: { not: null } } }),
    getPrisma().leaderNotification.count({ where: { readAt: null } }),
    getPrisma().loreAction.count({ where: { status: "REQUIRES_SPIN" } }),
  ]);

  const unlinkedNations = nationCount - linkedNationCount;

  return (
    <ControlLayout
      title="AdminCP"
      eyebrow="Admin"
      description="Use this panel for access control, data fixes, public content handoff, and audit review."
      links={adminCpLinks}
      stats={[
        { label: "Users", value: userCount },
        { label: "Nations", value: nationCount },
        { label: "Revisions", value: revisionCount },
        { label: "Unread Alerts", value: unreadAlerts },
      ]}
    >
      <div className="grid gap-5">
        <Panel>
          <Badge tone="accent">AdminCP</Badge>
          <h1 className="mt-4 text-3xl font-black text-white">
            Admin Control Panel
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            The admin workflow is now front-loaded around the tasks that create
            the most operational drag: user access, nation ownership, and audit
            visibility.
          </p>
        </Panel>

        <GameDateControl />

        <div className="grid gap-3 md:grid-cols-3">
          <Panel className="border-amber-300/25 bg-amber-300/10">
            <p className="text-xs font-bold uppercase text-amber-100">
              Nations without controllers
            </p>
            <p className="mt-1 text-3xl font-black text-amber-50">
              {unlinkedNations}
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-100/80">
              These nations need a linked leader account before the player
              dashboard is fully usable.
            </p>
          </Panel>
          <Panel className="bg-black/20">
            <p className="text-xs font-bold uppercase text-zinc-500">
              Linked nations
            </p>
            <p className="mt-1 text-3xl font-black text-zinc-50">
              {linkedNationCount}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Nations already mapped to a player controller.
            </p>
          </Panel>
          <Panel className="bg-black/20">
            <p className="text-xs font-bold uppercase text-zinc-500">
              Actions needing spin
            </p>
            <p className="mt-1 text-3xl font-black text-zinc-50">
              {actionsNeedingSpin}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Lore-side workload currently blocked on a wheel outcome.
            </p>
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="group block">
              <Panel className="h-full transition group-hover:-translate-y-0.5 group-hover:border-emerald-300/70 group-hover:bg-[color:var(--panel-strong)]">
                <Badge tone={action.tone}>{action.label}</Badge>
                <p className="mt-4 text-sm leading-6 text-zinc-300">
                  {action.detail}
                </p>
              </Panel>
            </Link>
          ))}
        </div>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge tone="warning">Content Routing</Badge>
              <h2 className="mt-3 text-2xl font-bold text-white">
                Public Content Surfaces
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                These are the public-facing areas most likely to need staff
                intervention during the day.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {contentActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 font-bold text-zinc-100 hover:border-emerald-300/70 hover:bg-white/5"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </ControlLayout>
  );
}
