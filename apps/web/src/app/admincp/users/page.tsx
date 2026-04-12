import { ControlLayout } from "@/components/layout/control-sidebar";
import { Panel } from "@/components/ui/shell";
import {
  assignUserNationAction,
  updateUserDiscordAction,
  updateUserRoleAction,
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

export default async function AdminUsersPage() {
  await requirePageRole([Role.ADMIN]);
  const [users, nations] = await Promise.all([
    getPrisma().user.findMany({
      orderBy: [{ name: "asc" }, { email: "asc" }],
      include: { nation: { select: { id: true, name: true } } },
    }),
    getPrisma().nation.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <ControlLayout title="AdminCP" links={links}>
      <div className="grid gap-5">
        <Panel>
          <h1 className="text-3xl font-black text-white">
            User and Role Management
          </h1>
          <p className="mt-3 text-slate-300">
            Link Discord accounts, update access levels, and assign a leader
            nation for wiki editing.
          </p>
        </Panel>

        <div className="grid gap-4">
          {users.map((user) => (
            <Panel
              key={user.id}
              className="grid gap-4 lg:grid-cols-[1fr_220px_260px_260px]"
            >
              <div>
                <h2 className="text-xl font-bold text-white">
                  {user.name ?? user.email ?? "Unnamed user"}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {user.email ?? user.id}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Discord:{" "}
                  {user.discordId ? `<@${user.discordId}>` : "Not linked"}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Nation: {user.nation?.name ?? "Unassigned"}
                </p>
              </div>

              <form
                action={updateUserRoleAction.bind(null, user.id)}
                className="grid content-start gap-2"
              >
                <label
                  className="text-xs font-bold uppercase tracking-wide text-slate-400"
                  htmlFor={`role-${user.id}`}
                >
                  Role
                </label>
                <select
                  id={`role-${user.id}`}
                  name="role"
                  defaultValue={user.role}
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                >
                  {Object.values(Role).map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <button className="rounded-lg border border-emerald-300/70 px-4 py-2 text-sm font-bold text-emerald-100">
                  Save Role
                </button>
              </form>

              <form
                action={assignUserNationAction.bind(null, user.id)}
                className="grid content-start gap-2"
              >
                <label
                  className="text-xs font-bold uppercase tracking-wide text-slate-400"
                  htmlFor={`nation-${user.id}`}
                >
                  Leader Nation
                </label>
                <select
                  id={`nation-${user.id}`}
                  name="nationId"
                  defaultValue={user.nationId ?? ""}
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                >
                  <option value="">Unassigned</option>
                  {nations.map((nation) => (
                    <option key={nation.id} value={nation.id}>
                      {nation.name}
                    </option>
                  ))}
                </select>
                <button className="rounded-lg border border-yellow-300/70 px-4 py-2 text-sm font-bold text-yellow-100">
                  Save Nation
                </button>
              </form>

              <form
                action={updateUserDiscordAction.bind(null, user.id)}
                className="grid content-start gap-2"
              >
                <label
                  className="text-xs font-bold uppercase tracking-wide text-slate-400"
                  htmlFor={`discord-${user.id}`}
                >
                  Discord User ID
                </label>
                <input
                  id={`discord-${user.id}`}
                  name="discordId"
                  inputMode="numeric"
                  pattern="\d{17,20}"
                  defaultValue={user.discordId ?? ""}
                  placeholder="1492546030112079892"
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                />
                <button className="rounded-lg border border-sky-300/70 px-4 py-2 text-sm font-bold text-sky-100">
                  Save Discord
                </button>
              </form>
            </Panel>
          ))}
        </div>
      </div>
    </ControlLayout>
  );
}
