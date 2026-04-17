import Link from "next/link";
import { LoreActionStatus } from "@prisma/client";
import { markLeaderNotificationReadAction } from "@/app/actions";
import { WikiRenderer } from "@/components/nation/wiki-renderer";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { getPrisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/permissions";

const activeStatuses = new Set<LoreActionStatus>([
  LoreActionStatus.CURRENT,
  LoreActionStatus.REQUIRES_SPIN,
]);

export default async function DashboardActionsPage() {
  const user = await requirePageUser();
  const nations = await getPrisma().nation.findMany({
    where: { leaderUserId: user.id },
    orderBy: { name: "asc" },
    include: {
      loreActions: {
        orderBy: { updatedAt: "desc" },
        include: {
          updates: {
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { createdByUser: { select: { name: true, email: true } } },
          },
        },
      },
      notifications: {
        orderBy: { createdAt: "desc" },
        take: 8,
        where: { readAt: null },
      },
    },
  });

  const actions = nations.flatMap((nation) =>
    nation.loreActions.map((action) => ({ ...action, nation })),
  );
  const active = actions.filter((action) => activeStatuses.has(action.status));
  const completed = actions.filter(
    (action) => action.status === LoreActionStatus.COMPLETED,
  );
  const notifications = nations.flatMap((nation) =>
    nation.notifications.map((notification) => ({ ...notification, nation })),
  );

  return (
    <PageShell className="grid gap-6">
      <div>
        <Badge tone="accent">My Actions</Badge>
        <h1 className="mt-4 text-4xl font-black text-zinc-50">
          My Nation Actions
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-300">
          Track staff-managed canon actions, spin requirements, and lore team
          updates for nations linked to your account.
        </p>
      </div>

      {nations.length === 0 ? (
        <Panel>
          <h2 className="text-2xl font-bold text-zinc-50">No nation linked</h2>
          <p className="mt-3 text-zinc-300">
            Ask lore team or an admin to link your account to a nation before
            actions can appear here.
          </p>
          <Link
            href="/nations"
            className="mt-5 inline-flex rounded-lg border border-emerald-300/70 px-4 py-2 font-bold text-emerald-100 hover:bg-emerald-300/10"
          >
            Browse Nations
          </Link>
        </Panel>
      ) : null}

      {notifications.length ? (
        <Panel className="border-amber-300/40 bg-amber-300/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge tone="warning">New Staff Updates</Badge>
              <h2 className="mt-3 text-2xl font-bold text-amber-50">
                Notifications
              </h2>
            </div>
            <Link
              href="/dashboard/notifications"
              className="rounded-lg border border-amber-200/50 px-3 py-2 text-sm font-bold text-amber-50 hover:bg-amber-200/10"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {notifications.map((notification) => (
              <form
                key={notification.id}
                action={markLeaderNotificationReadAction.bind(
                  null,
                  notification.id,
                )}
                className="rounded-lg border border-amber-200/20 bg-black/20 p-3"
              >
                <p className="text-sm font-bold text-amber-50">
                  {notification.title}
                </p>
                <p className="mt-1 text-sm text-amber-100">
                  {notification.body}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {notification.href ? (
                    <Link
                      href={notification.href}
                      className="rounded-lg border border-amber-200/40 px-3 py-2 text-xs font-bold text-amber-50 hover:bg-amber-200/10"
                    >
                      Open
                    </Link>
                  ) : null}
                  <button className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-zinc-100 hover:bg-white/5">
                    Mark read
                  </button>
                </div>
              </form>
            ))}
          </div>
        </Panel>
      ) : null}

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-zinc-50">Active Actions</h2>
          <Badge tone="accent">{active.length}</Badge>
        </div>
        {active.map((action) => (
          <Panel key={action.id}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{action.nation.name}</Badge>
              <Badge
                tone={
                  action.status === LoreActionStatus.REQUIRES_SPIN
                    ? "warning"
                    : "accent"
                }
              >
                {action.status.replace("_", " ")}
              </Badge>
              <Badge>{action.type}</Badge>
            </div>
            <p className="mt-3 text-sm font-semibold text-zinc-400">
              Estimated completion: {action.timeframe}
            </p>
            <div className="mt-4">
              <WikiRenderer content={action.action} />
            </div>
            {action.requiresSpinReason ? (
              <p className="mt-4 rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
                Requires spin: {action.requiresSpinReason}
              </p>
            ) : null}
            {action.updates.length ? (
              <div className="mt-5 grid gap-2">
                <h3 className="text-sm font-bold uppercase text-zinc-400">
                  Staff Updates
                </h3>
                {action.updates.map((update) => (
                  <div
                    key={update.id}
                    className="rounded-lg border border-white/10 bg-black/20 p-3"
                  >
                    <WikiRenderer content={update.content} />
                    <p className="mt-2 text-xs text-zinc-500">
                      {update.createdAt.toLocaleString("en-GB")} by{" "}
                      {update.createdByUser?.name ??
                        update.createdByUser?.email ??
                        "Lore team"}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </Panel>
        ))}
        {nations.length && active.length === 0 ? (
          <Panel className="text-zinc-300">
            No active actions are assigned to your nation right now.
          </Panel>
        ) : null}
      </section>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-zinc-50">
            Completed Archive
          </h2>
          <Badge>{completed.length}</Badge>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {completed.map((action) => (
            <Panel key={action.id}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{action.nation.name}</Badge>
                <Badge tone="accent">Completed</Badge>
                <Badge>{action.type}</Badge>
              </div>
              <p className="mt-3 text-sm text-zinc-500">
                {action.updatedAt.toLocaleString("en-GB")}
              </p>
              <div className="mt-3 line-clamp-4">
                <WikiRenderer content={action.action} />
              </div>
              {action.outcome ? (
                <div className="mt-3 rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-3">
                  <p className="text-xs font-bold uppercase text-emerald-100">
                    Outcome
                  </p>
                  <div className="mt-2">
                    <WikiRenderer content={action.outcome} />
                  </div>
                </div>
              ) : null}
            </Panel>
          ))}
          {nations.length && completed.length === 0 ? (
            <Panel className="text-zinc-300">
              No completed actions have been archived for your nation yet.
            </Panel>
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}
