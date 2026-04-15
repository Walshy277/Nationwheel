import { Role } from "@prisma/client";
import { updateUserDiscordAction, updateUserRoleAction } from "@/app/actions";
import { ControlLayout } from "@/components/layout/control-sidebar";
import { Panel } from "@/components/ui/shell";
import { adminCpLinks } from "@/lib/control-panels";
import { getPrisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/permissions";

export default async function AdminUsersPage() {
  await requirePageRole([Role.ADMIN, Role.OWNER]);

  const users = await getPrisma().user.findMany({
    orderBy: [{ name: "asc" }, { email: "asc" }],
    include: {
      leaderOf: { select: { id: true, name: true, slug: true } },
    },
  });

  return (
    <ControlLayout title="AdminCP" links={adminCpLinks}>
      <div className="grid gap-5">
        <Panel>
          <h1 className="text-3xl font-black text-white">User Management</h1>
          <p className="mt-3 text-slate-300">
            Manage account roles and Discord links. Nation control is assigned
            from nation management screens.
          </p>
        </Panel>

        <div className="grid gap-4">
          {users.map((user) => (
            <Panel
              key={user.id}
              className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px_260px]"
            >
              <div className="min-w-0">
                <h2 className="break-words text-xl font-bold text-white">
                  {user.name ?? user.email ?? "Unnamed user"}
                </h2>
                <p className="mt-1 break-words text-sm text-slate-400">
                  {user.email ?? user.id}
                </p>
                <p className="mt-1 break-words text-sm text-slate-400">
                  Discord: {user.discordId ? `<@${user.discordId}>` : "Not linked"}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Controls: {user.leaderOf.length ? user.leaderOf.map((nation) => nation.name).join(", ") : "Read-only"}
                </p>
              </div>

              <form
                action={updateUserRoleAction.bind(null, user.id)}
                className="grid content-start gap-2"
              >
                <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Role
                </label>
                <select
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
