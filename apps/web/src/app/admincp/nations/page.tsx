import { ControlLayout } from "@/components/layout/control-sidebar";
import { FlagUploadField } from "@/components/nation/flag-upload-field";
import { Panel } from "@/components/ui/shell";
import { createNationWikiTemplate } from "@nation-wheel/shared";
import {
  createNationAction,
  deleteNationAction,
  updateNationStatsAction,
  updateWikiAction,
} from "@/app/actions";
import { getPrisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/permissions";
import { Role } from "@prisma/client";

const links = [
  { href: "/admincp/nations", label: "Nations" },
  { href: "/admincp/users", label: "Users" },
  { href: "/admincp/map", label: "Map" },
  { href: "/admincp/logs", label: "Logs" },
];

export default async function AdminNationsPage() {
  await requirePageRole([Role.ADMIN, Role.OWNER]);
  const [nations, leaders] = await Promise.all([
    getPrisma().nation.findMany({
      orderBy: { name: "asc" },
      include: {
        wiki: true,
        leaderUser: { select: { id: true, name: true, email: true } },
      },
    }),
    getPrisma().user.findMany({
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <ControlLayout title="AdminCP" links={links}>
      <div className="grid gap-5">
        <Panel>
          <h1 className="text-3xl font-black text-white">Nation Management</h1>
          <p className="mt-3 text-slate-300">
            Create nations, update canon stats, link controller accounts, and remove retired
            records.
          </p>
        </Panel>

        <Panel>
          <h2 className="text-xl font-bold text-white">Create Nation</h2>
          <form
            action={createNationAction}
            encType="multipart/form-data"
            className="mt-5 grid gap-3 md:grid-cols-2"
          >
            <input
              name="name"
              required
              placeholder="Name"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
            <input
              name="people"
              required
              placeholder="Nation Size"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
            <input
              name="government"
              required
              placeholder="Government Type"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
            <input
              name="gdp"
              required
              placeholder="GDP"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
            <input
              name="economy"
              required
              placeholder="Economy Type"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
            <input
              name="military"
              required
              placeholder="Army size and ranking"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
            <select
              name="leaderUserId"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            >
              <option value="">No controller linked</option>
              {leaders.map((leader) => (
                <option key={leader.id} value={leader.id}>
                  {leader.name ?? leader.email ?? leader.id}
                </option>
              ))}
            </select>
            <FlagUploadField
              nationName="New nation"
              className="grid gap-2 text-sm text-slate-300"
            />
            <button className="rounded-lg bg-emerald-300 px-4 py-2 font-bold text-slate-950 md:col-span-2">
              Create Nation
            </button>
          </form>
        </Panel>

        <div className="grid gap-4">
          {nations.map((nation) => (
            <Panel key={nation.id}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {nation.name}
                  </h2>
                  <p className="text-sm text-slate-400">
                    Leader:{" "}
                    {nation.leaderName ?? "Unset"}
                  </p>
                </div>
                <form action={deleteNationAction.bind(null, nation.id)}>
                  <button className="rounded-lg border border-red-300/70 px-4 py-2 text-sm font-bold text-red-100">
                    Remove
                  </button>
                </form>
              </div>
              <form
                action={updateNationStatsAction.bind(null, nation.id)}
                encType="multipart/form-data"
                className="grid gap-3 md:grid-cols-2"
              >
                <input
                  name="name"
                  required
                  defaultValue={nation.name}
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                />
                <input type="hidden" name="slug" value={nation.slug} />
                <input type="hidden" name="returnPath" value="/admincp/nations" />
                <input
                  name="people"
                  required
                  defaultValue={nation.people}
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                />
                <input
                  name="government"
                  required
                  defaultValue={nation.government}
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                />
                <input
                  name="gdp"
                  required
                  defaultValue={nation.gdp}
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                />
                <input
                  name="economy"
                  required
                  defaultValue={nation.economy}
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                />
                <input
                  name="military"
                  required
                  defaultValue={nation.military}
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                />
                <select
                  name="leaderUserId"
                  defaultValue={nation.leaderUserId ?? ""}
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                >
                  <option value="">No controller linked</option>
                  {leaders.map((leader) => (
                    <option key={leader.id} value={leader.id}>
                      {leader.name ?? leader.email ?? leader.id}
                    </option>
                  ))}
                </select>
                <FlagUploadField
                  currentImage={nation.flagImage}
                  nationName={nation.name}
                  className="grid gap-2 text-sm text-slate-300"
                />
                <button className="rounded-lg border border-emerald-300/70 px-4 py-2 font-bold text-emerald-100 md:col-span-2">
                  Save Nation
                </button>
              </form>
              <details className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
                <summary className="font-bold text-zinc-100">
                  Edit Nation Wiki
                </summary>
                <form
                  action={updateWikiAction.bind(null, nation.id)}
                  className="mt-4 grid gap-3"
                >
                  <textarea
                    name="content"
                    required
                    defaultValue={
                      nation.wiki?.content ?? createNationWikiTemplate(nation)
                    }
                    className="min-h-[320px] p-4 font-mono text-sm leading-7 text-zinc-100"
                  />
                  <button className="rounded-lg border border-amber-300/70 px-4 py-2 font-bold text-amber-100 hover:bg-amber-300/10">
                    Save Wiki
                  </button>
                </form>
              </details>
            </Panel>
          ))}
        </div>
      </div>
    </ControlLayout>
  );
}
