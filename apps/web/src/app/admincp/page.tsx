import { ControlLayout } from "@/components/layout/control-sidebar";
import { Panel } from "@/components/ui/shell";
import { getPrisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/permissions";
import { Role } from "@prisma/client";

const links = [
  { href: "/admincp/nations", label: "Nations" },
  { href: "/admincp/users", label: "Users" },
  { href: "/admincp/map", label: "Map" },
  { href: "/admincp/logs", label: "Logs" },
];

export default async function AdminCpPage() {
  await requirePageRole([Role.ADMIN, Role.OWNER]);
  const [nationCount, userCount, revisionCount] = await Promise.all([
    getPrisma().nation.count(),
    getPrisma().user.count(),
    getPrisma().nationRevision.count(),
  ]);

  return (
    <ControlLayout title="AdminCP" links={links}>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <h1 className="text-3xl font-black text-white">
            Admin Control Panel
          </h1>
          <p className="mt-3 text-slate-300">
            Full operational control for nations, users, map data, and audit
            logs.
          </p>
        </Panel>
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
