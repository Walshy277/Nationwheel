import { Role } from "@prisma/client";
import {
  assignUserNationAction,
  updateUserDiscordAction,
} from "@/app/actions";
import { DatabaseRequired } from "@/components/control/database-required";
import { ControlLayout } from "@/components/layout/control-sidebar";
import { Panel } from "@/components/ui/shell";
import { hasDatabase, loreCpLinks } from "@/lib/control-panels";
import { getPrisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/permissions";

export default async function LoreMembersPage() {
  await requirePageRole([Role.LORE, Role.ADMIN]);
  if (!hasDatabase()) {
    return (
      <ControlLayout title="LoreCP" links={loreCpLinks}>
        <div className="grid gap-5">
          <Panel>
            <h1 className="text-3xl font-black text-white">Member Links</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">
              Link Discord members to their leader nation.
            </p>
          </Panel>
          <DatabaseRequired title="Member Storage Required" />
        </div>
      </ControlLayout>
    );
  }

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
    <ControlLayout title="LoreCP" links={loreCpLinks}>
      <div className="grid gap-5">
        <Panel>
          <h1 className="text-3xl font-black text-white">Member Links</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">
            Link Discord members to their leader nation. Members must have a web
            account before they appear here.
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
                  {user.name ?? user.email ?? "Unnamed member"}
                </h2>
                <p className="mt-1 break-words text-sm text-zinc-400">
                  {user.email ?? user.id}
                </p>
                <p className="mt-1 break-words text-sm text-zinc-400">
                  Discord:{" "}
                  {user.discordId ? `<@${user.discordId}>` : "Not linked"}
                </p>
                <p className="mt-2 text-sm text-zinc-300">
                  Nation: {user.nation?.name ?? "Unassigned"}
                </p>
              </div>

              <form
                action={assignUserNationAction.bind(null, user.id)}
                className="grid content-start gap-2"
              >
                <label
                  className="text-xs font-bold uppercase text-zinc-400"
                  htmlFor={`lore-nation-${user.id}`}
                >
                  Leader Nation
                </label>
                <select
                  id={`lore-nation-${user.id}`}
                  name="nationId"
                  defaultValue={user.nationId ?? ""}
                  className="min-h-11 min-w-0 px-3"
                >
                  <option value="">Unassigned</option>
                  {nations.map((nation) => (
                    <option key={nation.id} value={nation.id}>
                      {nation.name}
                    </option>
                  ))}
                </select>
                <button className="rounded-lg border border-yellow-300/70 px-4 py-2 text-sm font-bold text-yellow-100 hover:bg-yellow-300/10">
                  Save Nation
                </button>
              </form>

              <form
                action={updateUserDiscordAction.bind(null, user.id)}
                className="grid content-start gap-2"
              >
                <label
                  className="text-xs font-bold uppercase text-zinc-400"
                  htmlFor={`lore-discord-${user.id}`}
                >
                  Discord User ID
                </label>
                <input
                  id={`lore-discord-${user.id}`}
                  name="discordId"
                  inputMode="numeric"
                  pattern="\d{17,20}"
                  defaultValue={user.discordId ?? ""}
                  placeholder="1492546030112079892"
                  className="min-h-11 min-w-0 px-3"
                />
                <button className="rounded-lg border border-sky-300/70 px-4 py-2 text-sm font-bold text-sky-100 hover:bg-sky-300/10">
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
