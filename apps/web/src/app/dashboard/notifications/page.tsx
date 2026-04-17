import Link from "next/link";
import { markLeaderNotificationReadAction } from "@/app/actions";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { getPrisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/permissions";

export default async function DashboardNotificationsPage() {
  const user = await requirePageUser();
  const notifications = await getPrisma().leaderNotification.findMany({
    where: { nation: { leaderUserId: user.id } },
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { nation: { select: { name: true } } },
  });

  return (
    <PageShell className="grid gap-6">
      <div>
        <Badge tone="accent">Notifications</Badge>
        <h1 className="mt-4 text-4xl font-black text-zinc-50">
          Leader Notifications
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-300">
          Staff edits, action updates, spin calls, and nation messages appear
          here for linked leaders.
        </p>
      </div>

      <div className="grid gap-3">
        {notifications.map((notification) => (
          <Panel
            key={notification.id}
            className={
              notification.readAt
                ? "bg-[color:var(--panel)]/80"
                : "border-amber-300/35 bg-amber-300/10"
            }
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={notification.readAt ? "neutral" : "warning"}>
                    {notification.readAt ? "Read" : "Unread"}
                  </Badge>
                  <Badge>{notification.nation.name}</Badge>
                </div>
                <h2 className="mt-3 text-xl font-bold text-zinc-50">
                  {notification.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  {notification.body}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  {notification.createdAt.toLocaleString("en-GB")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {notification.href ? (
                  <Link
                    href={notification.href}
                    className="rounded-lg border border-emerald-300/70 px-3 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-300/10"
                  >
                    Open
                  </Link>
                ) : null}
                {!notification.readAt ? (
                  <form
                    action={markLeaderNotificationReadAction.bind(
                      null,
                      notification.id,
                    )}
                  >
                    <button className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-zinc-100 hover:bg-white/5">
                      Mark read
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          </Panel>
        ))}
        {notifications.length === 0 ? (
          <Panel className="text-zinc-300">
            No leader notifications yet.
          </Panel>
        ) : null}
      </div>
    </PageShell>
  );
}
