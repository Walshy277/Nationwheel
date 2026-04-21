import Link from "next/link";
import {
  markInboxReadAction,
  markLeaderNotificationReadAction,
  updateAlertPreferencesAction,
} from "@/app/actions";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { alertCategoryLabel, alertPreferenceOptions } from "@/lib/alerts";
import { requirePageUser } from "@/lib/permissions";
import { getPrisma } from "@/lib/prisma";

export default async function DashboardNotificationsPage() {
  const user = await requirePageUser();
  const prisma = getPrisma();
  const [notifications, preferences] = await Promise.all([
    prisma.leaderNotification.findMany({
      where: { nation: { leaderUserId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { nation: { select: { name: true } } },
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { alertOptOuts: true },
    }),
  ]);
  const unreadNotifications = notifications.filter(
    (notification) => !notification.readAt,
  );
  const optOuts = new Set(preferences.alertOptOuts);

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

      <Panel className="grid gap-4">
        <div>
          <Badge tone="accent">Alert Preferences</Badge>
          <h2 className="mt-3 text-2xl font-bold text-zinc-50">
            Choose what reaches the bell
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
            Tick the categories you want to mute. Postal mail still lands in
            your inbox even if its bell alert is muted here.
          </p>
        </div>
        <form
          action={updateAlertPreferencesAction}
          className="grid gap-3 lg:grid-cols-2"
        >
          {alertPreferenceOptions.map((option) => (
            <label
              key={option.category}
              className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-4"
            >
              <input
                type="checkbox"
                name="alertOptOuts"
                value={option.category}
                defaultChecked={optOuts.has(option.category)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-black/40 text-emerald-500"
              />
              <span className="grid gap-1">
                <span className="text-sm font-bold text-zinc-100">
                  Mute {option.label}
                </span>
                <span className="text-sm leading-6 text-zinc-400">
                  {option.detail}
                </span>
              </span>
            </label>
          ))}
          <div className="lg:col-span-2">
            <button className="rounded-lg bg-emerald-900 px-5 py-3 font-bold text-emerald-50 hover:bg-emerald-800">
              Save alert preferences
            </button>
          </div>
        </form>
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
                  <Badge tone="accent">
                    {alertCategoryLabel(notification.category)}
                  </Badge>
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
