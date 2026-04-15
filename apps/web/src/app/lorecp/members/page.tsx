import { Role } from "@prisma/client";
import { assignUserNationAction, updateUserDiscordAction } from "@/app/actions";
import { DatabaseRequired } from "@/components/control/database-required";
import { ControlLayout } from "@/components/layout/control-sidebar";
import { Panel } from "@/components/ui/shell";
import { hasDatabase, loreCpLinks } from "@/lib/control-panels";
import { getPrisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/permissions";

export default async function LoreMembersPage() {
  await requirePageRole([Role.LORE, Role.ADMIN, Role.OWNER]);
  if (!hasDatabase()) {
    return (
      <ControlLayout title="LoreCP" links={loreCpLinks}>
        <div className="grid gap-5">
          <Panel>
            <h1 className="text-3xl font-black text-white">Nation Links</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">
              Link Discord members to the nations they control.
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
      select: { id: true, name: true, email: true, discordId: true },
    }),
    getPrisma().nation.findMany({
      orderBy: { name: "asc" },
      include: { leaderUser: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return (
    <ControlLayout title="LoreCP" links={loreCpLinks}>
      <div className="grid gap-5">
        <Panel>
          <h1 className="text-3xl font-black text-white">Nation Links</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">
            Link a Discord user to the nation they control. Once linked, that
            account should be given the LEADER role.
          </p>
        </Panel>

        <div className="grid gap-4">
          {nations.map((nation) => (
            <Panel key={nation.id} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="min-w-0">
                <h2 className="break-words text-xl font-bold text-white">
                  {nation.name}
                </h2>
                <p className="mt-1 break-words text-sm text-zinc-400">
                  Fictional leader: {nation.leaderName ?? "Unset"}
                </p>
                <p className="mt-1 break-words text-sm text-zinc-400">
                  Linked controller: {nation.leaderUser?.name ?? nation.leaderUser?.email ?? "Unlinked"}
                </p>
              </div>

              <form
                action={assignUserNationAction.bind(null, nation.leaderUserId ?? "")}
                className="hidden"
              />

              <form action={async (formData) => {
                'use server';
                const userId = formData.get('userId');
                if (typeof userId !== 'string' || !userId) return;
                const { assignUserNationAction } = await import('@/app/actions');
                const fd = new FormData();
                fd.set('nationId', nation.id);
                await assignUserNationAction(userId, fd);
              }} className="grid content-start gap-2">
                <label className="text-xs font-bold uppercase text-zinc-400">
                  Controller Account
                </label>
                <select name="userId" defaultValue={nation.leaderUserId ?? ""} className="min-h-11 min-w-0 px-3">
                  <option value="">Select user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name ?? user.email ?? user.id}
                    </option>
                  ))}
                </select>
                <button className="rounded-lg border border-yellow-300/70 px-4 py-2 text-sm font-bold text-yellow-100 hover:bg-yellow-300/10">
                  Link Controller
                </button>
              </form>
            </Panel>
          ))}
        </div>
      </div>
    </ControlLayout>
  );
}
