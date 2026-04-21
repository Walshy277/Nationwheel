import Link from "next/link";
import { AlertCategory, LoreActionStatus } from "@prisma/client";
import { markLeaderNotificationReadAction } from "@/app/actions";
import { WikiRenderer } from "@/components/nation/wiki-renderer";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { alertCategoryLabel } from "@/lib/alerts";
import { getPrisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/permissions";

const activeStatuses = new Set<LoreActionStatus>([
  LoreActionStatus.CURRENT,
  LoreActionStatus.REQUIRES_SPIN,
]);

function latestTouch(action: {
  updatedAt: Date;
  updates: Array<{ createdAt: Date }>;
}) {
  const latestUpdate = action.updates[0]?.createdAt;
  return latestUpdate && latestUpdate > action.updatedAt
    ? latestUpdate
    : action.updatedAt;
}

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
        take: 12,
        where: {
          readAt: null,
          category: {
            in: [
              AlertCategory.ACTION_STATUS,
              AlertCategory.ACTION_UPDATE,
              AlertCategory.SPIN_RESULT,
            ],
          },
        },
      },
    },
  });

  const actions = nations.flatMap((nation) =>
    nation.loreActions.map((action) => ({ ...action, nation })),
  );
  const active = actions
    .filter((action) => activeStatuses.has(action.status))
    .sort((left, right) => latestTouch(right).getTime() - latestTouch(left).getTime());
  const spinRequired = active.filter(
    (action) => action.status === LoreActionStatus.REQUIRES_SPIN,
  );
  const current = active.filter(
    (action) => action.status === LoreActionStatus.CURRENT,
  );
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
          Canon Action Tracker
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-300">
          This view is trimmed down to the things that matter: what is blocked,
          what is active, and what staff changed most recently.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {spinRequired[0] ? (
            <Link
              href={`/dashboard/actions/${spinRequired[0].id}`}
              className="rounded-lg bg-amber-300 px-4 py-3 text-sm font-bold text-zinc-950 hover:bg-amber-200"
            >
              Open awaiting spin
            </Link>
          ) : null}
          {current[0] ? (
            <Link
              href={`/dashboard/actions/${current[0].id}`}
              className="rounded-lg border border-emerald-300/70 px-4 py-3 text-sm font-bold text-emerald-100 hover:bg-emerald-900/10"
            >
              Open latest active action
            </Link>
          ) : null}
        </div>
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
            className="mt-5 inline-flex rounded-lg border border-emerald-300/70 px-4 py-2 font-bold text-emerald-100 hover:bg-emerald-900/10"
          >
            Browse Nations
          </Link>
        </Panel>
      ) : null}

      {nations.length ? (
        <div className="grid gap-3 md:grid-cols-4">
          <Panel className="bg-black/20">
            <p className="text-xs font-bold uppercase text-zinc-500">
              Active actions
            </p>
            <p className="mt-1 text-3xl font-black text-zinc-50">
              {active.length}
            </p>
          </Panel>
          <Panel className="border-amber-300/25 bg-amber-300/10">
            <p className="text-xs font-bold uppercase text-amber-100">
              Requires spin
            </p>
            <p className="mt-1 text-3xl font-black text-amber-50">
              {spinRequired.length}
            </p>
            {spinRequired[0] ? (
              <Link
                href={`/dashboard/actions/${spinRequired[0].id}`}
                className="mt-3 inline-flex text-sm font-bold text-amber-50 hover:text-amber-100"
              >
                Open first blocked action
              </Link>
            ) : null}
          </Panel>
          <Panel className="bg-black/20">
            <p className="text-xs font-bold uppercase text-zinc-500">
              Unread action alerts
            </p>
            <p className="mt-1 text-3xl font-black text-zinc-50">
              {notifications.length}
            </p>
          </Panel>
          <Panel className="bg-black/20">
            <p className="text-xs font-bold uppercase text-zinc-500">
              Completed archive
            </p>
            <p className="mt-1 text-3xl font-black text-zinc-50">
              {completed.length}
            </p>
          </Panel>
        </div>
      ) : null}

      {notifications.length ? (
        <Panel className="border-amber-300/40 bg-amber-300/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge tone="warning">Needs Attention</Badge>
              <h2 className="mt-3 text-2xl font-bold text-amber-50">
                New action updates
              </h2>
            </div>
            <Link
              href="/dashboard/notifications"
              className="rounded-lg border border-amber-200/50 px-3 py-2 text-sm font-bold text-amber-50 hover:bg-amber-200/10"
            >
              Open Bell
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
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="warning">
                    {alertCategoryLabel(notification.category)}
                  </Badge>
                  <Badge>{notification.nation.name}</Badge>
                </div>
                <p className="mt-3 text-sm font-bold text-amber-50">
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

      {spinRequired.length ? (
        <section className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-zinc-50">Waiting On Spin</h2>
            <Badge tone="warning">{spinRequired.length}</Badge>
          </div>
          <div className="grid gap-3">
            {spinRequired.map((action) => (
              <Panel
                key={action.id}
                className="border-amber-300/25 bg-amber-300/10"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{action.nation.name}</Badge>
                    <Badge tone="warning">Requires spin</Badge>
                    <Badge>{action.type}</Badge>
                  </div>
                  <Link
                    href={`/dashboard/actions/${action.id}`}
                    className="rounded-lg border border-amber-200/50 px-3 py-2 text-sm font-bold text-amber-50 hover:bg-amber-200/10"
                  >
                    Open Action
                  </Link>
                </div>
                <p className="mt-3 text-sm font-semibold text-amber-100/90">
                  Estimated completion: {action.timeframe}
                </p>
                {action.requiresSpinReason ? (
                  <p className="mt-3 rounded-lg border border-amber-300/30 bg-black/20 p-3 text-sm text-amber-50">
                    {action.requiresSpinReason}
                  </p>
                ) : null}
                <div className="mt-4">
                  <WikiRenderer content={action.action} />
                </div>
              </Panel>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-zinc-50">Current Queue</h2>
          <Badge tone="accent">{current.length}</Badge>
        </div>
        {current.map((action) => {
          const latestUpdate = action.updates[0];

          return (
            <Panel key={action.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{action.nation.name}</Badge>
                  <Badge tone="accent">Current</Badge>
                  <Badge>{action.type}</Badge>
                </div>
                <Link
                  href={`/dashboard/actions/${action.id}`}
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-zinc-100 hover:bg-white/5"
                >
                  Open Action
                </Link>
              </div>
              <p className="mt-3 text-sm font-semibold text-zinc-400">
                Estimated completion: {action.timeframe}
              </p>
              <div className="mt-4">
                <WikiRenderer content={action.action} />
              </div>
              {latestUpdate ? (
                <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-xs font-bold uppercase text-zinc-500">
                    Latest staff update
                  </p>
                  <div className="mt-2">
                    <WikiRenderer content={latestUpdate.content} />
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {latestUpdate.createdAt.toLocaleString("en-GB")} by{" "}
                    {latestUpdate.createdByUser?.name ??
                      latestUpdate.createdByUser?.email ??
                      "Lore team"}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-500">
                  No staff update has been posted on this action yet.
                </p>
              )}
            </Panel>
          );
        })}
        {nations.length && current.length === 0 ? (
          <Panel className="text-zinc-300">
            No current actions are assigned to your nation right now.
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{action.nation.name}</Badge>
                  <Badge tone="accent">Completed</Badge>
                  <Badge>{action.type}</Badge>
                </div>
                <Link
                  href={`/dashboard/actions/${action.id}`}
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-zinc-100 hover:bg-white/5"
                >
                  Open Action
                </Link>
              </div>
              <p className="mt-3 text-sm text-zinc-500">
                {action.updatedAt.toLocaleString("en-GB")}
              </p>
              <div className="mt-3 line-clamp-4">
                <WikiRenderer content={action.action} />
              </div>
              {action.outcome ? (
                <div className="mt-3 rounded-lg border border-emerald-300/25 bg-emerald-900/10 p-3">
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
