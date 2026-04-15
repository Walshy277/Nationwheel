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

export default async function AdminLogsPage() {
  await requirePageRole([Role.ADMIN, Role.OWNER]);
  const revisions = await getPrisma().nationRevision.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      nation: { select: { name: true, slug: true } },
      changedByUser: { select: { name: true, email: true } },
    },
  });

  return (
    <ControlLayout title="AdminCP" links={links}>
      <div className="grid gap-5">
        <Panel>
          <h1 className="text-3xl font-black text-white">Revision Logs</h1>
          <p className="mt-3 text-slate-300">
            Recent stats and wiki changes across the world.
          </p>
        </Panel>

        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr className="border-b border-slate-800">
                <th className="py-3 pr-4">When</th>
                <th className="py-3 pr-4">Nation</th>
                <th className="py-3 pr-4">Type</th>
                <th className="py-3 pr-4">Changed By</th>
                <th className="py-3 pr-4">New Value</th>
              </tr>
            </thead>
            <tbody>
              {revisions.map((revision) => (
                <tr
                  key={revision.id}
                  className="border-b border-slate-900/90 align-top"
                >
                  <td className="py-3 pr-4 text-slate-300">
                    {revision.createdAt.toLocaleString("en-GB")}
                  </td>
                  <td className="py-3 pr-4 text-white">
                    {revision.nation.name}
                  </td>
                  <td className="py-3 pr-4 text-emerald-100">
                    {revision.fieldType}
                  </td>
                  <td className="py-3 pr-4 text-slate-300">
                    {revision.changedByUser?.name ??
                      revision.changedByUser?.email ??
                      "System"}
                  </td>
                  <td className="max-w-xl py-3 pr-4 font-mono text-xs leading-5 text-slate-400">
                    {JSON.stringify(revision.newValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {revisions.length === 0 ? (
            <p className="py-6 text-slate-400">
              No revisions have been recorded yet.
            </p>
          ) : null}
        </Panel>
      </div>
    </ControlLayout>
  );
}
