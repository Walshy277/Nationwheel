import Link from "next/link";
import {
  createNationMessageAction,
  markInboxReadAction,
  markLeaderNotificationReadAction,
  markNationMessageReadAction,
} from "@/app/actions";
import { WikiRenderer } from "@/components/nation/wiki-renderer";
import { Badge, PageShell, Panel } from "@/components/ui/shell";
import { getPrisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/permissions";

export default async function DashboardInboxPage() {
  const user = await requirePageUser();
  const [myNations, allNations, notifications, received, sent] =
    await Promise.all([
      getPrisma().nation.findMany({
        where: { leaderUserId: user.id },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      getPrisma().nation.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      getPrisma().leaderNotification.findMany({
        where: { nation: { leaderUserId: user.id } },
        orderBy: { createdAt: "desc" },
        take: 80,
        include: { nation: { select: { name: true } } },
      }),
      getPrisma().nationMessage.findMany({
        where: { toNation: { leaderUserId: user.id } },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          fromNation: { select: { name: true } },
          toNation: { select: { name: true } },
        },
      }),
      getPrisma().nationMessage.findMany({
        where: { fromNation: { leaderUserId: user.id } },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          fromNation: { select: { name: true } },
          toNation: { select: { name: true } },
        },
      }),
    ]);

  const unreadNotifications = notifications.filter(
    (notification) => !notification.readAt,
  );
  const unreadMessages = received.filter((message) => !message.readAt);
  const unreadCount = unreadNotifications.length + unreadMessages.length;

  return (
    <PageShell className="grid gap-6">
      <div>
        <Badge tone="accent">Postal Service</Badge>
        <h1 className="mt-4 text-4xl font-black text-zinc-50">
          World Postal Service
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-300">
          Private diplomatic mail is delivered through the Nation Wheel Postal
          Service, with tracking codes for every inter-nation dispatch.
        </p>
      </div>

      <Panel className="grid gap-4 border-emerald-300/30 bg-emerald-900/10 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="grid gap-2 sm:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase text-zinc-500">Unread</p>
            <p className="mt-1 text-3xl font-black text-zinc-50">
              {unreadCount}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-zinc-500">
              Parcels
            </p>
            <p className="mt-1 text-3xl font-black text-zinc-50">
              {received.length}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-zinc-500">
              Notifications
            </p>
            <p className="mt-1 text-3xl font-black text-zinc-50">
              {notifications.length}
            </p>
          </div>
        </div>
        {unreadCount ? (
          <form action={markInboxReadAction}>
            {unreadNotifications.map((notification) => (
              <input
                key={notification.id}
                type="hidden"
                name="notificationId"
                value={notification.id}
              />
            ))}
            {unreadMessages.map((message) => (
              <input
                key={message.id}
                type="hidden"
                name="messageId"
                value={message.id}
              />
            ))}
            <button className="rounded-lg bg-emerald-900 px-5 py-3 font-bold text-emerald-50 hover:bg-emerald-800">
              Mark all read
            </button>
          </form>
        ) : null}
      </Panel>

      <Panel className="bg-[color:var(--panel-strong)]/85">
        <h2 className="text-2xl font-bold text-zinc-50">Dispatch Mail</h2>
        {myNations.length ? (
          <form
            action={createNationMessageAction}
            className="mt-5 grid gap-3 lg:grid-cols-2"
          >
            <select name="fromNationId" required className="px-3 py-2">
              {myNations.map((nation) => (
                <option key={nation.id} value={nation.id}>
                  From {nation.name}
                </option>
              ))}
            </select>
            <select name="toNationId" required className="px-3 py-2">
              <option value="">Choose delivery nation</option>
              {allNations
                .filter(
                  (nation) => !myNations.some((mine) => mine.id === nation.id),
                )
                .map((nation) => (
                  <option key={nation.id} value={nation.id}>
                    {nation.name}
                  </option>
                ))}
            </select>
            <input
              name="subject"
              required
              maxLength={140}
              placeholder="Parcel subject"
              className="px-3 py-2 lg:col-span-2"
            />
            <textarea
              name="body"
              required
              maxLength={5000}
              placeholder="Private diplomatic mail. BBCode works here: [b]bold[/b], [quote]text[/quote], [url=https://example.com]link[/url]."
              className="min-h-40 p-3 lg:col-span-2"
            />
            <button className="rounded-lg bg-emerald-900 px-5 py-3 font-bold text-emerald-50 hover:bg-emerald-800 lg:col-span-2">
              Send via Postal Service
            </button>
          </form>
        ) : (
          <p className="mt-3 text-zinc-300">
            You need a linked nation before you can dispatch diplomatic mail.
          </p>
        )}
      </Panel>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-zinc-50">Incoming Mail</h2>
          <Badge tone={unreadMessages.length ? "warning" : "neutral"}>
            {unreadMessages.length} unread
          </Badge>
        </div>
        {received.map((message) => (
          <Panel
            key={message.id}
            className={message.readAt ? undefined : "border-amber-300/35"}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={message.readAt ? "neutral" : "warning"}>
                    {message.readAt ? "Read" : "Unread"}
                  </Badge>
                  <Badge>{message.status}</Badge>
                  <Badge>From {message.fromNation.name}</Badge>
                  <Badge>To {message.toNation.name}</Badge>
                </div>
                <h3 className="mt-3 text-xl font-bold text-zinc-50">
                  {message.subject}
                </h3>
                <p className="mt-2 text-xs text-zinc-500">
                  {message.serviceName} · Tracking {message.trackingCode} ·{" "}
                  {message.createdAt.toLocaleString("en-GB")}
                </p>
              </div>
              {!message.readAt ? (
                <form action={markNationMessageReadAction.bind(null, message.id)}>
                  <button className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-zinc-100 hover:bg-white/5">
                    Mark read
                  </button>
                </form>
              ) : null}
            </div>
            <div className="mt-4">
              <WikiRenderer content={message.body} />
            </div>
          </Panel>
        ))}
        {received.length === 0 ? (
          <Panel className="text-zinc-300">No incoming mail yet.</Panel>
        ) : null}
      </section>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-zinc-50">Notifications</h2>
          <Badge tone={unreadNotifications.length ? "warning" : "neutral"}>
            {unreadNotifications.length} unread
          </Badge>
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
                  <h3 className="mt-3 text-xl font-bold text-zinc-50">
                    {notification.title}
                  </h3>
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
            <Panel className="text-zinc-300">
              No leader notifications yet.
            </Panel>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-zinc-50">Sent</h2>
          <Badge>{sent.length}</Badge>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {sent.map((message) => (
            <Panel key={message.id}>
              <div className="flex flex-wrap items-center gap-2">
              <Badge>{message.status}</Badge>
              <Badge>To {message.toNation.name}</Badge>
                <Badge>{message.readAt ? "Read" : "Unread"}</Badge>
              </div>
              <h3 className="mt-3 text-lg font-bold text-zinc-50">
                {message.subject}
              </h3>
              <p className="mt-2 text-xs text-zinc-500">
                Tracking {message.trackingCode} ·{" "}
                {message.createdAt.toLocaleString("en-GB")}
              </p>
              <div className="mt-3 line-clamp-4">
                <WikiRenderer content={message.body} />
              </div>
            </Panel>
          ))}
          {sent.length === 0 ? (
            <Panel className="text-zinc-300">No sent messages yet.</Panel>
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}
