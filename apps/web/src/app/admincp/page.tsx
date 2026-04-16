import Link from "next/link";
import { ControlLayout } from "@/components/layout/control-sidebar";
import { Badge, Panel } from "@/components/ui/shell";
import { adminCpLinks } from "@/lib/control-panels";
import { getPrisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/permissions";
import { Role } from "@prisma/client";

const quickActions = [
  {
    href: "/admincp/users",
    label: "Users & Roles",
    detail: "Assign Journalist, Leader, Lore, Admin, and Owner access.",
    tone: "accent",
  },
  {
    href: "/admincp/nations",
    label: "Nations",
    detail: "Create nations, link controllers, and update profile pictures.",
    tone: "accent",
  },
  {
    href: "/admincp/logs",
    label: "Audit Logs",
    detail: "Review wiki, stat, flag, and leader-name changes.",
    tone: "warning",
  },
  {
    href: "/newscp",
    label: "NewsCP",
    detail: "Open the journalist publishing desk.",
    tone: "neutral",
  },
] as const;

export default async function AdminCpPage() {
  await requirePageRole([Role.ADMIN, Role.OWNER]);
  const [nationCount, userCount, revisionCount] = await Promise.all([
    getPrisma().nation.count(),
    getPrisma().user.count(),
    getPrisma().nationRevision.count(),
  ]);

  return (
    <ControlLayout title="AdminCP" links={adminCpLinks}>
      <div className="grid gap-5">
        <Panel>
          <Badge tone="accent">AdminCP</Badge>
          <h1 className="mt-4 text-3xl font-black text-white">
            Admin Control Panel
          </h1>
          <p className="mt-3 text-slate-300">
            Start with users and nations. Logs and map tools stay available,
            but the highest-frequency tasks are first.
          </p>
        </Panel>

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

        <Panel className="grid gap-3">
          <h2 className="text-xl font-bold text-white">World Status</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-slate-700 bg-slate-950/45 p-3">
              <div className="text-2xl font-black text-white">
                {nationCount}
              </div>
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Nations
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/45 p-3">
              <div className="text-2xl font-black text-white">{userCount}</div>
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Users
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/45 p-3">
              <div className="text-2xl font-black text-white">
                {revisionCount}
              </div>
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Revisions
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </ControlLayout>
  );
}
