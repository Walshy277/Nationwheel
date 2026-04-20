import Link from "next/link";
import {
  markInboxReadAction,
  markLeaderNotificationReadAction,
} from "@/app/actions";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { requirePageUser } from "@/lib/permissions";
import { getPrisma } from "@/lib/prisma";

export default async function DashboardNotificationsPage() {
  const user = await requirePageUser();
  const notifications = await getPrisma().leaderNotification.findMany({
    where: { nation: { leaderUserId: user.id } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { nation: { select: { name: true } } },
  });
  const unreadNotifications = notifications.filter(
    (notification) => !notification.readAt,
  );

  return (
    <PageShell className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge tone="accent">Notifications</Badge>
          <h1 className="mt-4 text-4xl font-black text-zinc-50">
            Notification Bell
          </h1>
          <p className="mt-3 max-w-3xl text-zinc-300">
            Staff updates, action changes, wiki edits, and postal alerts for
            nations linked to your account.
          </p>
        </div>
        <Link
          href="/dashboard/inbox"
          className="rounded-lg border border-emerald-300/70 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-900/10"
        >
          Open Mail
        </Link>
      </div>

      <Panel className="grid gap-4 border-emerald-300/30 bg-emerald-900/10 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase text-zinc-500">Unread</p>
            <p className="mt-1 text-3xl font-black text-zinc-50">
              {unreadNotifications.length}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-zinc-500">Total</p>
            <p className="mt-1 text-3xl font-black text-zinc-50">
              {notifications.length}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-zinc-500">
              Linked Nations
            </p>
            <p className="mt-1 text-3xl font-black text-zinc-50">
              {new Set(notifications.map((notification) => notification.nation.name)).size}
            </p>
          </div>
        </div>
        {unreadNotifications.length ? (
          <form action={markInboxReadAction}>
            {unreadNotifications.map((notification) => (
              <input
                key={notification.id}
                type="hidden"
                name="notificationId"
                value={notification.id}
              />
            ))}
            <button className="rounded-lg bg-emerald-900 px-5 py-3 font-bold text-emerald-50 hover:bg-emerald-800">
              Mark all read
            </button>
          </form>
        ) : null}
      </Panel>

      <section className="grid gap-3">
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
                    className="rounded-lg border border-emerald-300/70 px-3 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-900/10"
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
          <Panel className="text-zinc-300">No notifications yet.</Panel>
        ) : null}
      </section>
    </PageShell>
  );
}
